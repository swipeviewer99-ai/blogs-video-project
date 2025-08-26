require('dotenv').config();
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const VideoSegment = require('./video/VideoSegment');
const {
  concatenateVideos,
  mixBackgroundMusic,
  addSubtitles,
  generateSyncedASS,
  getMediaDuration,
  speedUpVideo,
  convertToTs,
  concatenateTsFiles
} = require('./video/video-processor');
const { ensureDirectoryExists } = require('./utils/file-helpers');

async function main() {
  try {
    logger.info('Starting video generation process...');

    const outputDir = 'output';
    ensureDirectoryExists(path.join(outputDir, 'temp.txt'));

    const blogData = JSON.parse(fs.readFileSync('assets/resume1.json', 'utf-8'));

    const cmnStr0 = `Hello Friends, Ever spent hours tweaking your resume for a ${blogData.Template_Type} role and still felt unsure? Here's the breakthrough you need.`;
    const cmnStr1 = `This is what a winning ${blogData.Template_Type} resume looks like. — clean, professional, and built to impress. Want to create yours without wasting hours? Let’s build it right away.`;
    const cmnStr2 = "Head over to ResumeGemini.com and click on 'Build Your Resume for Free'. You’ll see a range of professional templates — just pick the one that suits you best. Now, let’s upload your raw resume. In just few moments, leveraging the power of AI, your resume is transformed into a standout, professionally crafted document — polished, impactful, and ready for download. Here’s the preview!";
    const comStr3 = "Share it instantly and seize your dream job.";
    const cmnStr4 = "Give your resume an extra edge, visit ResumeGemini.com today!";

    const texts = [cmnStr0, cmnStr1, cmnStr2, comStr3, cmnStr4];

    const segments = [
        new VideoSegment(texts[0], 'static-image'),
        new VideoSegment(texts[1], 'scrolling-image', {
            imageUrl: `https://wpimages.resumegemini.com/resumesamples/${blogData.ImageName}.png`,
        }),
        new VideoSegment(texts[2], 'static-image'),
        new VideoSegment(texts[3], 'static-image'),
        new VideoSegment(texts[4], 'static-image'),
    ];

    const partVideos = await Promise.all(segments.map(s => s.create()));

    const tsFiles = [];
    for (let i = 0; i < partVideos.length; i++) {
        const tsPath = `output/part_${i}.ts`;
        await convertToTs(partVideos[i], tsPath);
        tsFiles.push(tsPath);
    }

    const concatenatedPath = path.join(outputDir, 'merged.mp4');
    await concatenateTsFiles(tsFiles, concatenatedPath);

    const finalVideoPath = path.join(outputDir, 'final_video.mp4');
    await mixBackgroundMusic(concatenatedPath, 'assets/music.mp3', finalVideoPath);

    const spedUpPath = path.join(outputDir, 'final_video_30sec.mp4');
    await speedUpVideo(finalVideoPath, spedUpPath);

    const partDurations = await Promise.all(partVideos.map(p => getMediaDuration(p)));
    const assPath = path.join(outputDir, 'captions.ass');
    generateSyncedASS(texts, partDurations, assPath, 30);

    const subtitledPath = path.join(outputDir, 'final_video_with_captions.mp4');
    await addSubtitles(spedUpPath, assPath, subtitledPath);

    logger.info(`Video generation complete! Final video at: ${subtitledPath}`);
  } catch (error) {
    logger.error({ err: error }, 'Video generation failed');
    process.exit(1);
  }
}

module.exports = main;
