require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Map platform param to R6Data API values
function mapPlatform(platform) {
  switch (platform.toLowerCase()) {
    case 'pc':
      return { platformType: 'uplay', platformFamilies: 'pc' };
    case 'xbox':
      return { platformType: 'xbl', platformFamilies: 'xbox' };
    case 'psn':
      return { platformType: 'psn', platformFamilies: 'psn' };
    default:
      return null;
  }
}

// Helper to parse a board_id profile into simplified stats
function parseProfile(fullProfile) {
  const stats = fullProfile.season_statistics;
  const profileInfo = fullProfile.profile;

  return {
    rank: profileInfo.rank || 0,
    rankPoints: profileInfo.rank_points || 0,
    kills: stats.kills || 0,
    deaths: stats.deaths || 0,
    wins: stats.match_outcomes.wins || 0,
    losses: stats.match_outcomes.losses || 0,
    abandons: stats.match_outcomes.abandons || 0,
    kd: stats.deaths ? (stats.kills / stats.deaths).toFixed(2) : 'N/A',
    matchesPlayed: (stats.match_outcomes.wins || 0) + (stats.match_outcomes.losses || 0) + (stats.match_outcomes.abandons || 0)
  };
}

app.get('/r6/:platform/:username', async (req, res) => {
  const { platform, username } = req.params;
  const cacheKey = `${platform}:${username}`;

  // Return cached data if still fresh
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    } else {
      cache.delete(cacheKey);
    }
  }

  const mapped = mapPlatform(platform);
  if (!mapped) return res.status(400).json({ error: 'Invalid platform. Use pc, xbox, or psn.' });

  try {
    const apiUrl = `https://api.r6data.eu/api/stats?type=stats&nameOnPlatform=${encodeURIComponent(username)}&platformType=${mapped.platformType}&platform_families=${mapped.platformFamilies}`;
    const { data } = await axios.get(apiUrl);

    if (!data?.platform_families_full_profiles?.length) {
      return res.status(404).json({ error: 'Stats not found for this player.' });
    }

    const pfProfile = data.platform_families_full_profiles.find(pf => pf.platform_family.toLowerCase() === platform.toLowerCase());
    if (!pfProfile) return res.status(404).json({ error: 'Platform stats not found.' });

    const result = { ranked: null, standard: null };

    // Extract ranked stats
    const rankedBoard = pfProfile.board_ids_full_profiles.find(b => b.board_id === 'ranked');
    if (rankedBoard?.full_profiles?.length) {
      result.ranked = parseProfile(rankedBoard.full_profiles[0]);
    }

    // Extract casual/standard stats
    const standardBoard = pfProfile.board_ids_full_profiles.find(b => b.board_id === 'standard');
    if (standardBoard?.full_profiles?.length) {
      result.standard = parseProfile(standardBoard.full_profiles[0]);
    }

    // Include username and platform
    result.username = username;
    result.platform = platform;

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return res.json(result);
  } catch (error) {
    console.error(`Error fetching R6Data stats for ${username} on ${platform}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch stats from API.' });
  }
});

app.listen(port, () => {
  console.log(`R6Data proxy API running at http://localhost:${port}`);
});
