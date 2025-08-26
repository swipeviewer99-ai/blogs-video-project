const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

ffmpeg.setFfmpegPath(config.ffmpegPath);

const getMediaDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.error(`Error getting duration for ${filePath}`, err);
        return reject(err);
      }
      resolve(metadata.format.duration);
    });
  });
};

async function createVideoFromImageAndAudio(imagePath, audioPath, outputPath) {
  const duration = await getMediaDuration(audioPath);
  logger.info(`Audio duration for ${audioPath}: ${duration} seconds`);
  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(imagePath)
      .inputOptions(['-loop 1'])
      .addInput(audioPath)
      .outputOptions([
        '-vf', 'scale=1920:1008',
        '-c:v libx264',
        '-preset veryfast',
        '-c:a aac',
        '-b:a 192k',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-shortest',
      ])
      .output(outputPath)
      .on('end', () => {
        logger.info(`Video saved to ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('FFmpeg error:', err.message);
        reject(err);
      })
      .run();
  });
}

async function concatenateVideos(videoPaths, outputPath) {
  const listFile = 'output/files.txt';
  fs.writeFileSync(listFile, videoPaths.map(p => `file '${path.resolve(p)}'`).join('\n'));

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-fflags +genpts',
        '-avoid_negative_ts', 'make_zero'
      ])
      .output(outputPath)
      .on('end', () => {
        logger.info('✅ Merged video created');
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('❌ FFmpeg concat error:', err.message);
        reject(err);
      })
      .run();
  });
}

async function mixBackgroundMusic(videoPath, musicPath, outputPath) {
  const videoDuration = await getMediaDuration(videoPath);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(musicPath)
      .complexFilter([
        '[1:a]volume=0.2[a1]',
        '[0:a][a1]amix=inputs=2:duration=longest:dropout_transition=2[aout]',
      ])
      .outputOptions([
        '-map 0:v',
        '-map [aout]',
        '-c:v copy',
        '-t', `${videoDuration}`,
        '-movflags +faststart',
      ])
      .save(outputPath)
      .on('end', () => {
        logger.info(`✅ Final video with background music saved to ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', reject);
  });
}

async function createScrollingImageVideo(imageUrl, audioPath, outputPath) {
  const localImagePath = 'assets/temp_resume_scroll.png';
  logger.info('imageurl', imageUrl);
  await require('./image-generator').downloadImage(imageUrl, localImagePath);

  const audioDuration = await getMediaDuration(audioPath);
  logger.info(`Audio duration for ${audioPath}: ${audioDuration} seconds`);

  const filter = `[0:v]scale=1920:-1,format=rgba,loop=999:size=1:start=0,setpts=N/FRAME_RATE/TB,crop=1920:1008:0:'(ih-1008)*t/${audioDuration}'[v];[1:a]anull[a]`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(localImagePath)
      .inputOptions(['-loop 1'])
      .addInput(audioPath)
      .complexFilter(filter)
      .outputOptions([
        '-map', '[v]',
        '-map', '[a]',
        '-t', `${audioDuration}`,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-fflags', '+genpts',
        '-avoid_negative_ts', 'make_zero',
      ])
      .output(outputPath)
      .on('end', () => {
        logger.info(`🎞️ Scrolling image video saved to ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('❌ FFmpeg error:', err.message);
        reject(err);
      })
      .run();
  });
}

async function convertToTs(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-bsf:v h264_mp4toannexb',
          '-f mpegts'
        ])
        .save(outputPath)
        .on('end', () => {
          logger.info(`🔁 Converted to TS: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', reject);
    });
  }

  async function concatenateTsFiles(tsFiles, outputPath) {
    const listFile = 'output/ts_list.txt';
    fs.writeFileSync(listFile, tsFiles.map(f => `file '${path.resolve(f)}'`).join('\n'));

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c copy',
          '-bsf:a aac_adtstoasc'
        ])
        .save(outputPath)
        .on('end', () => {
          logger.info('✅ TS-based merged video created');
          resolve(outputPath);
        })
        .on('error', reject);
    });
  }

  async function speedUpVideo(inputPath, outputPath, targetDuration = 40) {
    const actualDuration = await getMediaDuration(inputPath);
    const speedFactor = actualDuration / targetDuration;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`setpts=${1 / speedFactor}*PTS`)
        .audioFilters(`atempo=${Math.min(speedFactor, 1.25)}`)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-movflags +faststart',
          '-pix_fmt yuv420p'
        ])
        .on('end', () => {
          logger.info(`✅ Final sped-up video saved to ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error('❌ Speed-up error:', err.message);
          reject(err);
        })
        .save(outputPath);
    });
  }

  function generateSyncedASS(partTexts, partDurations, outputPath, fontSize = 14) {
    let assContent = `[Script Info]
  ScriptType: v4.00+
  PlayResX: 1920
  PlayResY: 1080
  Timer: 100.0000

  [V4+ Styles]
  Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
  Style: Default,Arial,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1

  [Events]
  Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
  `;

    let currentTime = 0;

    for (let i = 0; i < partTexts.length; i++) {
      const sentences = partTexts[i].match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [partTexts[i]];
      const perLineDuration = (partDurations[i] / sentences.length )* 1.25;

      sentences.forEach((line, j) => {
        const start = formatASSTime(currentTime + j * perLineDuration);
        const end = formatASSTime(currentTime + (j + 1) * perLineDuration);
        assContent += `Dialogue: 0,${start},${end},Default,,0,0,0,,${line}\n`;
      });

      currentTime += partDurations[i];
    }

    fs.writeFileSync(outputPath, assContent, 'utf8');
  }

  function formatASSTime(seconds) {
    const h = String(Math.floor(seconds / 3600));
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    const cs = String(Math.floor((seconds % 1) * 100)).padStart(2, '0'); // centiseconds
    return `${h}:${m}:${s}.${cs}`;
  }

  async function addSubtitles(videoPath, srtPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
        '-vf', `subtitles=${srtPath.replace(/\\/g, '\\\\')}`,
          '-c:a', 'copy'
        ])
        .on('end', () => {
          logger.info(`✅ Subtitled video saved to ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', reject)
        .save(outputPath);
    });
  }

module.exports = {
  getMediaDuration,
  createVideoFromImageAndAudio,
  concatenateVideos,
  mixBackgroundMusic,
  createScrollingImageVideo,
  convertToTs,
  concatenateTsFiles,
  speedUpVideo,
  generateSyncedASS,
  addSubtitles,
};
