const path = require('path');
const { generateAudio } = require('../services/google-tts');
const {
  createVideoFromImageAndAudio,
  createScrollingImageVideo,
} = require('./video-processor');
const { createImageWithBackground } = require('./image-generator');
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

  async create() {
    logger.info(`Creating video segment ${this.id} of type ${this.type}`);
    ensureDirectoryExists(path.join(this.outputDir, 'temp.txt'));

    const audioPath = path.join(this.outputDir, `audio_${this.id}.mp3`);
    await generateAudio(this.text, audioPath);

    const videoPath = path.join(this.outputDir, `video_${this.id}.mp4`);

    switch (this.type) {
      case 'static-image': {
        const imagePath = path.join(this.outputDir, `image_${this.id}.png`);
        await createImageWithBackground(this.text, imagePath);
        return createVideoFromImageAndAudio(imagePath, audioPath, videoPath);
      }
      case 'scrolling-image': {
        if (!this.options.imageUrl) {
          throw new Error('imageUrl is required for scrolling-image segment');
        }
        return createScrollingImageVideo(
          this.options.imageUrl,
          audioPath,
          videoPath
        );
      }
      default:
        throw new Error(`Unknown video segment type: ${this.type}`);
    }
  }
}

module.exports = VideoSegment;
