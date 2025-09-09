// src/video/VideoSegment.js
const path = require('path');
const { generateAudio } = require('../services/azure-tts');
const {
  createVideoFromImageAndAudio,
  createScrollingImageVideo,
  overlayAudioOnVideo,
} = require('./video-processor');
const { ensureDirectoryExists } = require('../utils/file-helpers');
const logger = require('../utils/logger');

class VideoSegment {
  constructor(text, type, options = {}) {
    this.text = text;
    this.type = type;
    this.options = options;
    this.id = Math.random().toString(36).substring(7);
    this.outputDir = 'output';
  }

  async create(iteration) {
    try {
      logger.info(`🎬 Creating video segment ${this.id} of type ${this.type}`);
      ensureDirectoryExists(path.join(this.outputDir, 'temp.txt'));

      const audioPath = path.join(this.outputDir, `audio_v${iteration}_${this.id}.mp3`);
      logger.info(`🔊 Generating audio for segment ${this.id}...`);
      await generateAudio(this.text, audioPath);
      logger.info(`✅ Audio generated: ${audioPath}`);

      const videoPath = path.join(this.outputDir, `video_v${iteration}_${this.id}.mp4`);

      switch (this.type) {
        case 'static-image': {
          if (!this.options.imageUrl) {
            throw new Error('imageUrl is required for static-image segment');
          }
          logger.info(`🖼️ Creating static image video from ${this.options.imageUrl}`);
          const result = await createVideoFromImageAndAudio(this.options.imageUrl, audioPath, videoPath);
          logger.info(`✅ Static image segment complete: ${videoPath}`);
          return result;
        }

        case 'scrolling-image': {
          if (!this.options.imageUrl || !this.options.downloadPath) {
            throw new Error('imageUrl and downloadPath are required for scrolling-image segment');
          }
          logger.info(`⬇️ Downloading image for scrolling effect: ${this.options.imageUrl}`);
          const result = await createScrollingImageVideo(
            this.options.imageUrl,
            audioPath,
            videoPath,
            this.options.downloadPath
          );
          logger.info(`✅ Scrolling image segment complete: ${videoPath}`);
          return result;
        }

        case 'video-overlay': {
          if (!this.options.baseVideoPath) {
            throw new Error('baseVideoPath is required for video-overlay segment');
          }
          logger.info(`🎥 Overlaying audio on base video: ${this.options.baseVideoPath}`);
          const result = await overlayAudioOnVideo(this.options.baseVideoPath, audioPath, videoPath);
          logger.info(`✅ Video overlay segment complete: ${videoPath}`);
          return result;
        }

        default:
          throw new Error(`Unknown video segment type: ${this.type}`);
      }
    } catch (ex) {
      logger.error(`❌ Error in VideoSegment.create [${this.type}]:`, ex);
      throw ex;
    }
  }
}

module.exports = VideoSegment;
