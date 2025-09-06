// src/video/VideoSegment.js
const path = require('path');
const { generateAudio } = require('../services/azure-tts');
const {
  createVideoFromImageAndAudio,
  createScrollingImageVideo,
  overlayAudioOnVideo,
} = require('./video-processor');
const { createImageWithBackground,downloadImage } = require('./image-generator');
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
    try{
    logger.info(`Creating video segment ${this.id} of type ${this.type}`);
    ensureDirectoryExists(path.join(this.outputDir, 'temp.txt'));

    const audioPath = path.join(this.outputDir, `audio_v${iteration}_${this.id}.mp3`);
    await generateAudio(this.text, audioPath);

    const videoPath = path.join(this.outputDir, `video_v${iteration}_${this.id}.mp4`);

    switch (this.type) {
      case 'static-image': {
       let imagePath ='';
        // let imagePath = path.join(this.outputDir, `image_${this.id}.png`);
        if (!this.options.imageUrl ) {
          throw new Error('imageUrl is required for static-image segment');
         
        }
        else {
          imagePath = this.options.imageUrl;
        }
        //const downloadedImgPath = `assets/${imagePath}.png`
        try{
        return await createVideoFromImageAndAudio(imagePath, audioPath, videoPath);
        }
        catch(err)
        {
          console.log(err);
        }
      }
      case 'scrolling-image': {
        if (!this.options.imageUrl || !this.options.downloadPath) {
          throw new Error('imageUrl is required for scrolling-image segment');
        }
        return await createScrollingImageVideo(
          this.options.imageUrl,
          audioPath,
          videoPath,
          this.options.downloadPath 
        );
      }
      case 'video-overlay': {
        try{ 
        if (!this.options.baseVideoPath) {
          throw new Error('baseVideoPath is required for video-overlay segment');
        }
        return await overlayAudioOnVideo(
          this.options.baseVideoPath,
          audioPath,
          videoPath
        );
      }
      catch(err)
      {
        console.log(err);
        throw err;
      }
      }
      default:
        throw new Error(`Unknown video segment type: ${this.type}`);
    }
  } catch(ex)
  {
    console.log("ex in VideoSegment ", ex);
    throw ex;
  }
}
}

module.exports = VideoSegment;