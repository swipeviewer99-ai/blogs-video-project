const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

function generateAudio(text, outputPath) {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(config.azureTtsKey, config.azureTtsRegion);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputPath);

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          logger.info(`Audio content written to file: ${outputPath}`);
          resolve(outputPath);
        } else {
          logger.error(`Speech synthesis canceled, ${result.errorDetails}`);
          reject(new Error(result.errorDetails));
        }
        synthesizer.close();
      },
      error => {
        logger.error(`Error synthesizing speech: ${error}`);
        synthesizer.close();
        reject(error);
      }
    );
  });
}

module.exports = {
  generateAudio,
};
