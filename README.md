# R6 API Proxy

A simple Node.js server that fetches R6 stats using the R6Data API and caches responses for 5 minutes. Used by the Discord bot to avoid hitting the API directly.

## Features:

Fetch ranked and casual stats for Rainbow Six Siege players.

In-memory caching to reduce API calls, returns simplified JSON with RP, wins, losses, kills, deaths, KD, and matches played.

## Requirements:

Node.js v18+

npm

R6Data API key

## Setup

### 1. Clone the repo:

git clone <r6-api-repo-url>
cd <repo-directory>


### 2. Install dependencies:

npm install express axios dotenv


### 3. Create a .env file:

PORT=3000


### 4. Start the API server:

node r6api.js


### 5. The API endpoint will be:

GET http://localhost:3000/r6/:platform/:username


Example: http://localhost:3000/r6/pc/MyUsername

## API Response Example
{
  "username": "MyUsername",
  "platform": "pc",
  "ranked": {
    "rank": 15,
    "rankPoints": 3050,
    "wins": 120,
    "losses": 100,
    "abandons": 5,
    "kd": "1.5",
    "matchesPlayed": 225
  },
  "standard": { ... }
}
