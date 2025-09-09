process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// process.env.GOOGLE_APPLICATION_CREDENTIALS = "./gca-auth-key.json";
// process.env.FFMPEG_PATH = "=C:\\Users\\deept\\Downloads\\ffmpeg-7.1.1-full_build\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe";
// process.env.AZURE_TTS_KEY = "GHaTp7A7jY1pDknNE6KxvAned2X1yvehOBY3KlwFCsAGjDLeARPSJQQJ99BHACYeBjFXJ3w3AAAYACOGqdCx";
// process.env.AZURE_TTS_REGION = "eastus";
require("dotenv").config();

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
const { getResumeData } = require('./utils/db-connector');

const { ensureDirectoryExists } = require('./utils/file-helpers');
const { uploadVideo } = require('./video/upload-video');
let iteration = 0;

async function main() {
  try {
    try {
      const rows = await getResumeData();

      for (let row of rows) {
        iteration++;
        let resumeContent = JSON.parse(row.ResumeContent);
        resumeContent['Title'] = row.Title;
        resumeContent['TitleId'] = row.JobTitleId;
        console.log(`Title: ${row.Title}, ResumeContent: ${row.ResumeContent}, PreviewImageUrl: ${row.PreviewImageUrl}`);

        logger.info(`Starting video generation process for the role of ${row.Title}.........`);

        const outputDir = 'output';
        ensureDirectoryExists(path.join(outputDir, 'temp.txt'));

        const blogData = resumeContent;

        const cmnStr0 = `Hello Friends, Ever spent hours tweaking your resume for a ${blogData.Title} role and still felt unsure? Here's the breakthrough you need.`;
        const cmnStr1 = `This is what a winning ${blogData.Title} resume looks like. — clean, professional, and built to impress. Want to create yours without wasting hours? Let’s build it right away.`;
        const cmnStr2 = "Head over to ResumeGemini.com and click on 'Build Your Resume for Free'. You’ll see a range of professional templates — just pick the one that suits you best. Now, let’s upload your raw resume. In just few moments, leveraging the power of AI, your resume is transformed into a standout, professionally crafted document — polished, impactful, and ready for download. Here’s the preview!";
        const comStr3 = "Share it instantly and seize your dream job.";
        const cmnStr4 = "So wanna give your resume an extra edge? Visit ResumeGemini.com today!";

        const texts = [cmnStr0, cmnStr1, cmnStr2, comStr3, cmnStr4];
        const RandomSegmentVersion = Math.floor(Math.random() * (3 - 1 + 1)) + 1;

        console.log(`RandomSegmentVersion generated is : ${RandomSegmentVersion} ..............`);

        const segments = [
          new VideoSegment(texts[0], 'video-overlay', { baseVideoPath: `assets/part0_v${RandomSegmentVersion}.mp4` }),
          new VideoSegment(texts[1], 'scrolling-image', {
            imageUrl: `https://wpimages.resumegemini.com/resumesamples/${blogData.ImageName}.png`,
            downloadPath: `assets/${blogData.Title}.png`
          }),
          new VideoSegment(texts[2], 'video-overlay', { baseVideoPath: 'assets/part2.mp4' }),
          new VideoSegment(texts[3], 'static-image', { imageUrl: `assets/${blogData.Title}.png` }),
          new VideoSegment(texts[4], 'static-image', { imageUrl: `assets/part4_v${RandomSegmentVersion}.png` }),
        ];

        // Run segment creation sequentially with timeout + logging
        const partVideos = [];
        for (const s of segments) {
          console.log(`➡️ Starting segment: ${s.type}`);
          try {
            const video = await Promise.race([
              s.create(iteration),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`⏳ Timeout in segment ${s.type}`)), 60_000)
              )
            ]);
            console.log(`✅ Finished segment: ${s.type}`);
            partVideos.push(video);
          } catch (err) {
            console.error(`❌ Error in segment ${s.type}:`, err);
            throw err; // stop process
          }
        }

        // Convert each part to TS sequentially
      const tsFiles = [];

    // Convert each part to TS sequentially
    for (let i = 0; i < partVideos.length; i++) {
      console.log(`➡️ Converting part ${i + 1} to TS...`);
      const tsFile = await convertToTs(
        partVideos[i],
        path.join(outputDir, `part_v${iteration}_${i + 1}.ts`)
      );
      console.log(`✅ Converted part ${i + 1} to TS`);
      tsFiles.push(tsFile);
    }

    const meta = {
      Id: blogData.TitleId,
      Title: blogData.Title,
      Skills: blogData.Skills,
      PreviewImageUrl: blogData.ImageName
    };

    // Merge TS files losslessly
    console.log("➡️ Concatenating TS files...");
    const concatenatedPath = path.join(outputDir, "merged.mp4");
    await concatenateTsFiles(tsFiles, concatenatedPath);
    console.log("✅ Concatenated TS files");

    // Prepare final output filename
    const jobTitle = blogData.Title.replace(/\s+/g, "_");
    const finalVideoPath = path.join(outputDir, `${jobTitle}.mp4`);

    // Mix background music
    console.log("➡️ Mixing background music...");
    await mixBackgroundMusic(concatenatedPath, "assets/music.mp3", finalVideoPath);
    console.log("✅ Background music mixed");

    // Upload
    console.log("➡️ Uploading final video...");
    await uploadVideo("seo-videos", finalVideoPath, meta);
    console.log("✅ Upload complete");

    // Generate captions
    const partDurations = await Promise.all(partVideos.map(p => getMediaDuration(p)));
    const assPath = path.join(outputDir, "captions.ass");
    generateSyncedASS(texts, partDurations, assPath, 30);

    console.log(`🎬 Video generation complete! Final video at: ${finalVideoPath}`);
    //return finalVideoPath;

        // logger.info(`Video generation complete! Final video at: ${subtitledPath}`);
      }
    } catch (err) {
      console.error("Service Error:", err);
    }
  } catch (error) {
    logger.error({ err: error }, `Video generation failed for ${iteration}`);
    throw error;
  }
}

module.exports = main;
