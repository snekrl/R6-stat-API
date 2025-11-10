require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

app.get('/r6stats/:platform/:username', async (req, res) => {
  const { platform, username } = req.params;

  try {
    const url = `https://r6.tracker.network/profile/${platform}/${encodeURIComponent(username)}/overview`;

    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://r6.tracker.network/',
        'Connection': 'keep-alive',
      }
    });

    const $ = cheerio.load(html);

    // The stats are in divs with class "trn-defstat__value"
    const statsElements = $('.trn-defstat__value');

    if (!statsElements || statsElements.length === 0) {
      return res.status(404).json({ error: 'Player not found or stats not available' });
    }

    const level = $(statsElements[0]).text().trim();
    const kd = $(statsElements[1]).text().trim();
    const wins = $(statsElements[2]).text().trim();
    const losses = $(statsElements[3]).text().trim();
    const winPercent = $(statsElements[4]).text().trim();
    const matchesPlayed = $(statsElements[5]).text().trim();

    const stats = {
      username,
      platform,
      level,
      kd,
      wins,
      losses,
      winPercent,
      matchesPlayed
    };

    res.json(stats);

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});



app.listen(port, () => console.log(`R6 Tracker scraper API running at http://localhost:${port}`));
