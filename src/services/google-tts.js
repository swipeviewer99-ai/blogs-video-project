const fs = require('fs');
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');
const config = require('../config');
const logger = require('../utils/logger');

const client = new textToSpeech.TextToSpeechClient({
  credentials: config.googleApplicationCredentials,
});

async function generateAudio(text, outputPath) {
  try {
    logger.info(`Generating audio for text: "${text}"`);
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    const [response] = await client.synthesizeSpeech(request);
    await util.promisify(fs.writeFile)(outputPath, response.audioContent, 'binary');
    logger.info(`Audio content written to file: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error({ err: error }, 'Error generating audio from Google TTS');
    throw error;
  }
}

module.exports = {
  generateAudio,
};
