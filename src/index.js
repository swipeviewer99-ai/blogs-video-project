process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.env.GOOGLE_APPLICATION_CREDENTIALS = "./gca-auth-key.json";
process.env.FFMPEG_PATH = "=C:\\Users\\deept\\Downloads\\ffmpeg-7.1.1-full_build\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe";
process.env.AZURE_TTS_KEY = "GHaTp7A7jY1pDknNE6KxvAned2X1yvehOBY3KlwFCsAGjDLeARPSJQQJ99BHACYeBjFXJ3w3AAAYACOGqdCx";
process.env.AZURE_TTS_REGION = "eastus";
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

        const blogData = resumeContent; //JSON.parse(fs.readFileSync('assets/resume1.json', 'utf-8'));

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
            imageUrl: `https://wpimages.resumegemini.com/resumesamples/${blogData.ImageName}.png`, downloadPath: `assets/${blogData.Title}.png`
          }),
         new VideoSegment(texts[2], 'video-overlay', { baseVideoPath: 'assets/part2.mp4' }), // some issue with this one.. 
          new VideoSegment(texts[3], 'static-image', { imageUrl: `assets/${blogData.Title}.png` }),
          new VideoSegment(texts[4], 'static-image', { imageUrl: `assets/part4_v${RandomSegmentVersion}.png` }),
        ];

        const firstSegment = segments[0];
        const firstResult = await firstSegment.create(iteration);
        // Run first 4 in parallel
        const firstBatch = segments.slice(1, 4);
        let firstResults = [];
        // const firstResults = await Promise.each(firstBatch.map(s => s.create(iteration)));
        try{
        for (const s of firstBatch) {
          //await s.create(iteration);
          const result = await s.create(iteration);
          firstResults.push(result);
        }
      }
      catch(err)
      {
        console.log(`err while creating segments ${err}`);
        throw err;
      }
        // Run last one sequentially (after first batch completes)
        const lastSegment = segments[4]; // temporary for debugging issue
        const lastResult = await lastSegment.create(iteration);

        // Merge results
        const partVideos = [firstResult, ...firstResults, lastResult];
        // const partVideos = await Promise.all(segments.map(s => s.create()));

        // const concatenatedPath = path.join(outputDir, 'merged.mp4');
        // await concatenateVideos(partVideos, concatenatedPath);
        // Convert each part to TS first
        const tsFiles = await Promise.all(
          partVideos.map((p, i) => convertToTs(p, path.join(outputDir, `part_v${iteration}_${i}.ts`)))
        );

        const meta = {
          Id: blogData.TitleId,
          Title: blogData.Title, Skills: blogData.Skills, PreviewImageUrl: blogData.ImageName
        }
        // Merge TS files losslessly
        const concatenatedPath = path.join(outputDir, 'merged.mp4');
        await concatenateTsFiles(tsFiles, concatenatedPath);

        const jobTitle = blogData.Title.replace(/\s+/g, "_");
        const finalVideoPath = path.join(outputDir, `${jobTitle}.mp4`);

        await mixBackgroundMusic(concatenatedPath, 'assets/music.mp3', finalVideoPath);
        await uploadVideo("seo-videos", finalVideoPath, meta).catch(console.error);
        // const spedUpPath = path.join(outputDir, 'final_video_30sec.mp4');
        // wait speedUpVideo(finalVideoPath, spedUpPath);


        const partDurations = await Promise.all(partVideos.map(p => getMediaDuration(p)));
        const assPath = path.join(outputDir, 'captions.ass');
        generateSyncedASS(texts, partDurations, assPath, 30);

        // const subtitledPath = path.join(outputDir, 'final_video_with_captions.mp4');
        // await addSubtitles(spedUpPath, assPath, subtitledPath);

        // logger.info(`Video generation complete! Final video at: ${subtitledPath}`);
      }
    } catch (err) {
      console.error("Service Error:", err);
    }
  } catch (error) {
    logger.error({ err: error }, `Video generation failed for ${iteration}`);
    throw error;
   // process.exit(1);
  }
}


module.exports = main;