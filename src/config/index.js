require('dotenv').config();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

let credentials;
try {
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath) {
    const resolvedPath = path.resolve(credsPath);
    const credsContent = fs.readFileSync(resolvedPath, 'utf-8');
    credentials = JSON.parse(credsContent);
  }
} catch (error) {
  logger.error({ err: error }, 'Failed to load Google Cloud credentials');
  credentials = undefined;
}


const config = {
  googleApplicationCredentials: credentials,
  ffmpegPath: process.env.FFMPEG_PATH,
};

module.exports = config;
