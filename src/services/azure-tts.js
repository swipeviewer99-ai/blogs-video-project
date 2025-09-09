const sdk = require("microsoft-cognitiveservices-speech-sdk");
const logger = require("../utils/logger");
const config = require("../config");

// Internal function that performs the synthesis
function _generateAudio(text, outputPath) {
  return new Promise((resolve, reject) => {
    logger.info(`🔊 [Azure TTS] Generating audio (len=${text.length}) -> ${outputPath}`);

    // Timeout safeguard (30s)
    const timeout = setTimeout(() => {
      logger.error("⏳ [Azure TTS] Request timed out (30s)");
      reject(new Error("Azure TTS request timed out (30s)"));
    }, 30000);

    try {
      if (!config.azureTtsKey || !config.azureTtsRegion) {
        clearTimeout(timeout);
        return reject(new Error("Azure TTS key/region not set in config"));
      }

      const endpoint = `https://${config.azureTtsRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
      logger.info(`[Azure TTS] Using endpoint: ${endpoint}`);
      logger.info(
        `[Azure TTS] Region=${config.azureTtsRegion}, Key=${config.azureTtsKey.slice(
          0,
          4
        )}...****`
      );

      const speechConfig = sdk.SpeechConfig.fromSubscription(
        config.azureTtsKey,
        config.azureTtsRegion
      );

      // Force a valid voice to avoid SDK defaults failing
      speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
      speechConfig.speechSynthesisOutputFormat =
        sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputPath);
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      synthesizer.speakTextAsync(
        text,
        result => {
          clearTimeout(timeout);

          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            logger.info(`✅ [Azure TTS] Audio written: ${outputPath}`);
            synthesizer.close();
            resolve(outputPath);
          } else {
            const errorMsg = `Speech synthesis canceled: ${result.errorDetails}`;
            logger.error(`❌ [Azure TTS] ${errorMsg}`);
            synthesizer.close();
            reject(new Error(errorMsg));
          }
        },
        error => {
          clearTimeout(timeout);
          logger.error("❌ [Azure TTS] Error:", error);
          synthesizer.close();
          reject(error);
        }
      );
    } catch (err) {
      clearTimeout(timeout);
      logger.error("❌ [Azure TTS] Exception:", err);
      reject(err);
    }
  });
}

// Promise queue to ensure only one TTS operation runs at a time
let lastPromise = Promise.resolve();

function generateAudio(text, outputPath) {
  lastPromise = lastPromise.then(() => _generateAudio(text, outputPath));
  return lastPromise;
}

module.exports = {
  generateAudio,
};
