const fs = require('fs');
const path = require('path');
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');
const ffmpeg = require('fluent-ffmpeg');
//const ffmpegPath = require('ffmpeg-static');
//https://online-video-cutter.com/#google_vignette
const { createCanvas, loadImage } = require('canvas');

process.env.GOOGLE_APPLICATION_CREDENTIALS = "C:\\Users\\deept\\blogs-project\\gca-auth-key.json";

//ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfmpegPath(`C:\\Users\\deept\\Downloads\\ffmpeg-7.1.1-full_build\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe`);
const client = new textToSpeech.TextToSpeechClient();

const axios = require('axios');

async function downloadImage(url, outputPath) {

  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'arraybuffer'
  });
  fs.writeFileSync(outputPath, response.data);
  console.log(`✅ Downloaded background image to ${outputPath}`);
}


function splitText(text, maxSentences = 1) {
  // const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
  const sentences = text.split(/\r?\n/);
  const chunks = [];

  for (let i = 0; i < sentences.length; i += maxSentences) {
    const chunk = sentences.slice(i, i + maxSentences).join(' ').trim();
    if (chunk) chunks.push(chunk);
  }

  return chunks;
}

async function generateAudio(text, outputPath) {
  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };
  const [response] = await client.synthesizeSpeech(request);
  await util.promisify(fs.writeFile)(outputPath, response.audioContent, 'binary');
  console.log(`Audio saved to ${outputPath}`);
}

async function createImage(text, outputPath) {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');

  // Set background to white
  ctx.fillStyle = '#FFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set text properties
  ctx.fillStyle = '#000';
  ctx.font = '40px Sans';
  ctx.textAlign = 'center';

  // Break text into lines
  const lines = text.match(/.{1,60}/g);

  // Center vertically
  const lineHeight = 60;
  const totalHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalHeight) / 2 + lineHeight;

  // Draw text lines centered
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  // Save image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Image saved to ${outputPath}`);
}

// async function createImageWithBackground(text, outputPath) {
//   const canvas = createCanvas(1280, 720);
//   const ctx = canvas.getContext('2d');

//   // Load the resume image
//   const background = await loadImage('assets/Resumes/Visionary.png');

//   // Draw the background image to cover the canvas
//   ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

//   // Set text properties
//   ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Semi-transparent white box for readability
//   ctx.fillRect(80, 180, 1120, 360); // Optional: light backdrop behind text

//   ctx.fillStyle = '#000';
//   ctx.font = '36px Sans';
//   ctx.textAlign = 'center';

//   // Break text into lines (approx 60 chars per line)
//   const lines = text.match(/.{1,60}/g);
//   const lineHeight = 50;
//   const totalHeight = lines.length * lineHeight;
//   const startY = (canvas.height - totalHeight) / 2 + lineHeight;

//   lines.forEach((line, i) => {
//     ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
//   });

//   // Save image
//   const buffer = canvas.toBuffer('image/png');
//   fs.writeFileSync(outputPath, buffer);
//   console.log(`Image saved to ${outputPath}`);
// }

async function createImageWithBackground(text, outputPath) {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');

  const background = await loadImage('assets/Resumes/Visionary.png');
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Draw semi-transparent white box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(80, 180, 1120, 360);

  // Text settings
  ctx.fillStyle = '#000';
  ctx.font = '32px Sans';
  ctx.textAlign = 'center';

  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const lines = wrapText(ctx, text, 1000); // max width
  const lineHeight = 50;
  const totalHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalHeight) / 2 + lineHeight;

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Image saved to ${outputPath}`);
}

async function DownloadAndCreateImage(text, outputPath, imageuuid) {
  const imageUrl = `https://wpimages.resumegemini.com/resumesamples/${imageuuid}.png`;
  // const localImagePath = 'assets/Resumes/DownloadedResume.png';

  await downloadImage(imageUrl, outputPath);

  // Modify the createImageWithBackground function to accept dynamic background path
  // await createImageWithBackground(text, outputPath);
}

async function createImage1(text, outputPath) {
  const fs = require('fs');
  const { createCanvas, loadImage } = require('canvas');

  text = JSON.stringify(blogData.Summary);
  //"Highly motivated and result-oriented Software Development Manager with over 10 years of experience in the full software development lifecycle (SDLC). Proven track record of designing and building highly scalable, secure, and performant software systems.";

  //const outputPath = 'output/summary_with_resume.png';
  createImageWithBackground(text, outputPath);

}





const getAudioDuration = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

async function createVideo(imagePath, audioPath, outputPath) {
  const duration = await getAudioDuration(audioPath);
  console.log(`Audio duration for ${audioPath}: ${duration} seconds`);
  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(imagePath)
      .inputOptions(['-loop 1'])        // Loop image once
      .addInput(audioPath)
      .outputOptions([
        '-vf', 'scale=1920:1008',
        '-c:v libx264',
        '-preset veryfast',
        '-c:a aac',
        '-b:a 192k',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-shortest'
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`Video saved to ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message);
        reject(err);
      })
      .run();

  })
}

// async function concatenateVideos(videoPaths, outputPath) {
//   console.log('part videos', videoPaths.length);
//   const listFile = 'output/files.txt';
//   fs.writeFileSync(listFile, videoPaths.map(p => `file '${path.resolve(p)}'`).join('\n'));

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(listFile)
//       .inputOptions(['-f concat', '-safe 0'])
//       .outputOptions([
//         '-vf', 'scale=1920:1008',
//         '-c:v libx264',
//         '-preset veryfast',
//         '-c:a aac',
//         '-movflags +faststart',
//         '-shortest'
//       ])
//       .output(outputPath)
//       .on('end', () => {
//         console.log('Merged video created');
//         resolve();
//       })
//       .on('error', (err) => {
//         console.error('FFmpeg error:', err.message);
//         reject(err);
//       })
//       .run();

//     // ffmpeg()
//     //   .input(listFile)
//     //   .inputOptions(['-f concat', '-safe 0'])
//     //   .outputOptions(['-c copy'])
//     //   .output(outputPath)
//     //   .on('end', () => {
//     //     console.log('Merged video created');
//     //     resolve();
//     //   })
//     //   .on('error', reject)
//     //   .run();
//   });
//   // async function concatenateVideos(videoPaths, outputPath) {
//   //   console.log('part videos', videoPaths.length);
//   //   const listFile = 'output/files.txt';
//   //   fs.writeFileSync(listFile, videoPaths.map(p => `file '${path.resolve(p)}'`).join('\n'));
  
//   //   return new Promise((resolve, reject) => {
//   //     ffmpeg()
//   //       .input(listFile)
//   //       .inputOptions(['-f concat', '-safe 0'])
//   //       .outputOptions([
//   //         '-c:v libx264',
//   //         '-c:a aac',
//   //         '-preset veryfast',
//   //         '-pix_fmt yuv420p',
//   //         '-movflags +faststart',
//   //         '-shortest' // important: cut off precisely at last stream end
//   //       ])
//   //       .output(outputPath)
//   //       .on('end', () => {
//   //         console.log('✅ Merged video created');
//   //         resolve();
//   //       })
//   //       .on('error', (err) => {
//   //         console.error('❌ FFmpeg concat error:', err.message);
//   //         reject(err);
//   //       })
//   //       .run();
//   //   });
//   // }  
// }
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
      // .outputOptions([
      //   '-c:v libx264',
      //   '-c:a aac',
      //   '-pix_fmt yuv420p',
      //   '-movflags +faststart',
      //   '-fflags', '+genpts',
      //   '-avoid_negative_ts', 'make_zero'
      // ])
      .output(outputPath)
      .on('end', () => {
        console.log('✅ Merged video created');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg concat error:', err.message);
        reject(err);
      })
      .run();
  });
}



async function mixBackgroundMusic(videoPath, musicPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(musicPath)
      .complexFilter([
        '[1:a]volume=0.2[a1]',
        '[0:a][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]',
      ])
      .outputOptions(['-map 0:v', '-map [aout]', '-c:v copy', '-shortest'])
      .save(outputPath)
      .on('end', () => {
        console.log(`Final video with background music saved to ${outputPath}`);
        resolve();
      })
      .on('error', reject);
  });
}
const getMediaDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

async function createScrollingImageVideo(imageUrl, audioPath, outputPath) {
  const localImagePath = 'assets/temp_resume_scroll.png';
  console.log('imageurl', imageUrl);
  await downloadImage(imageUrl, localImagePath);

  const audioDuration = await getAudioDuration(audioPath);
  console.log(`Audio duration for ${audioPath}: ${audioDuration} seconds`);

  const filter = `[0:v]scale=1920:-1,format=rgba,loop=999:size=1:start=0,setpts=N/FRAME_RATE/TB,` +
    `crop=1920:1008:0:'(ih-1008)*t/${audioDuration}'[v];` +
    `[1:a]anull[a]`;

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
        '-avoid_negative_ts', 'make_zero'
      ])
      // .outputOptions([
      //   '-map', '[v]',
      //   '-map', '[a]',
      //   '-t', `${audioDuration}`, // ⬅️ this is critical
      //   '-c:v', 'libx264',
      //   '-pix_fmt', 'yuv420p',
      //   '-c:a', 'aac'
      // ])
      .output(outputPath)
      .on('end', () => {
        console.log(`🎞️ Scrolling image video saved to ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        reject(err);
      })
      .run();
  });
}
async function normalizeTimestamps(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .outputOptions([
        '-fflags +genpts',
        '-reset_timestamps 1',
        '-avoid_negative_ts make_zero',
        '-c:v libx264',
        '-c:a aac',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

async function blogToVideo(blogText, bgMusicPath = 'assets/music.mp3') {
  const parts = splitText(blogText);
  if (!fs.existsSync('output')) fs.mkdirSync('output');

  const partVideos = [];
  console.log(parts.length);

  for (let i = 0; i < parts.length; i++) {
    const audioPath = `output/audio_${i}.mp3`;
    let imagePath = `output/image_${i}.png`;
    let videoPath = `output/part_${i}.mp4`;

    await generateAudio(parts[i], audioPath);
    const audioDuration = await getAudioDuration(audioPath);
    console.log(`Audio duration for ${audioPath}: ${audioDuration} seconds`);
    if ((i === 0) || (i === 2)) { // base video

      const baseVideoPath = `assets/part${i}.mp4`; // your background video for Part 0 & 1
      videoPath = `output/part_${i}.mp4`;

      await new Promise((resolve, reject) => {
        ffmpeg()
          .addInput(baseVideoPath)
          .addInput(audioPath)
          .videoFilters('scale=1920:1008')
          .outputOptions([
            '-map 0:v:0',
            '-map 1:a:0',
            '-t', `${audioDuration}`,              // ✅ match duration precisely
            '-c:v libx264',
            '-c:a aac',
            '-pix_fmt yuv420p',
            '-movflags +faststart',
            '-fflags +genpts',                     // ✅ generate proper PTS
            '-avoid_negative_ts make_zero'         // ✅ align all timestamps to 0
          ])
          .save(videoPath)
          .on('end', resolve)
          .on('error', reject);
      });

      // await new Promise((resolve, reject) => {
      //   ffmpeg()
      //     .addInput(baseVideoPath)
      //     .addInput(audioPath).videoFilters('scale=1920:1008')
      //     // .outputOptions([
      //     //   '-c:v libx264',
      //     //   '-preset veryfast',
      //     //   '-c:a aac',
      //     //   '-b:a 192k',
      //     //   '-shortest',
      //     //   '-pix_fmt yuv420p',
      //     //   '-movflags +faststart'
      //     // ])
      //     .outputOptions([
      //       '-c:v libx264',
      //       '-c:a aac',
      //       '-map 0:v:0',
      //       '-map 1:a:0',
      //       '-shortest'
      //     ])

      //     .save(videoPath)
      //     .on('end', () => {
      //       console.log(`Part 0 video (with background video) saved to ${videoPath}`);
      //       resolve();
      //     })
      //     .on('error', reject);
      // });
    }
    // else if (i === 4) {
    //   const baseVideoPath = 'assets/Part2.mp4';
    //   videoPath = `output/part_${i}.mp4`;

    //   const summaryText = `Highly motivated and result-oriented Software Development Manager
    // with over 10 years of experience in SDLC.
    // Proven track record of building scalable, secure systems.
    // Passionate about leading and mentoring high-performing teams.`;

    //   const textFilePath = 'output/part2_summary.txt';
    //   fs.writeFileSync(textFilePath, summaryText);

    //   const drawFilter = `drawbox=x=0:y=600:w=iw:h=120:color=white@0.7:t=max,` +
    //     `drawtext=textfile=${path.resolve(textFilePath).replace(/\\/g, '/').replace(':', '\\:')}` +
    //     `:fontcolor=black:fontsize=28:x=(w-text_w)/2:y=630:box=0:` +
    //     `fontfile=C\\:/Windows/Fonts/arial.ttf`;


    //   await new Promise((resolve, reject) => {
    //     ffmpeg()
    //       .input(baseVideoPath)
    //       .input(audioPath)
    //       .complexFilter([drawFilter])
    //       .outputOptions([
    //         '-c:v libx264',
    //         '-c:a aac',
    //         '-map 0:v:0',
    //         '-map 1:a:0',
    //         '-shortest',
    //         '-movflags +faststart'
    //       ])
    //       .save(videoPath)
    //       .on('end', () => {
    //         console.log(`✅ Part 2 video (with summary overlay) saved to ${videoPath}`);
    //         resolve();
    //       })
    //       .on('error', (err) => {
    //         console.error('❌ FFmpeg error for Part 2:', err.message);
    //         reject(err);
    //       });
    //   });
    // }
    else if (i === 1) {
      // await DownloadAndCreateImage(parts[i], imagePath, blogData.ImageName);

      const imageUrl = `https://wpimages.resumegemini.com/resumesamples/${blogData.ImageName}.png`;

      await createScrollingImageVideo(imageUrl, audioPath, videoPath);
    }
    else { // background image only

      await createImage1(parts[i], imagePath);


      await createVideo(imagePath, audioPath, videoPath);
    }

   // partVideos.push(videoPath);
   const normalizedPath = `output/part_${i}_norm.mp4`;
await normalizeTimestamps(videoPath, normalizedPath);
partVideos.push(normalizedPath);
  }


  const concatenated = 'output/merged_video.mp4';
  try {
    await concatenateVideos(partVideos, concatenated);
  } catch (err) {
    console.error("❌ Failed during video concatenation:", err);
    return; // stop further processing
  }
  // await concatenateVideos(partVideos, concatenated);
  await mixBackgroundMusic(concatenated, bgMusicPath, 'output/final_video.mp4');
}

const blogData = JSON.parse(fs.readFileSync('assets/resume1.json', 'utf-8'));

const cmnStr0 = "Hello Friends, Ever spent hours tweaking your resume for a " + blogData.Template_Type + "role and still felt unsure? Here's the breakthrough you need." 
//"using our recruiter-approved pre-written templates. "
// "struggling to land your job for this title?"

//const cmnStr0 = "Hello Friends, have you ever wondered now you can create a resume for" + blogData.Template_Type + "using our recruiter-approved pre-written templates. " // With our step-by-step builder and expert-designed templates, you can create a standout resume effortlessly
const cmnStr1 = "This is what a winning " + blogData.Template_Type + " resume looks like. — clean, professional, and built to impress. Want to create yours without wasting hours? Let’s build it right away."
const cmnStr2 = "Head over to ResumeGeminiDOTCom and click on 'Build Your Resume for Free'. You’ll see a range of professional templates — just pick the one that suits you best. Now, let’s upload your raw resume. In just moments, leveraging the power of AI, your resume is transformed into a standout, professionally crafted document — polished, impactful, and ready for download."

// const cmnStr2 = ""
// Combine title and paragraphs into one blog post string
// Have you ever wondered you can create a resume for "jobtitle" in 2 minutes.
// Let's build it right away.
// Showcase multiple templates - wi65yehntgthin a single video  - kind of scrolling through the templates. [ ref: recorded video ]
const blogPost = [cmnStr0, cmnStr1,cmnStr2].join('\n\n');
// "Let's build it right away. 
// 
// You may go to ResumeGeminiDOTCom and then click on build your resume for free. You will be presented with multiple templates, please choose your preferred template. Let's say we choose this one and fill the other necessary details. The final resume will be available for download. You may also choose to upload your raw resume and translate it to the professional version."].join('\n\n');

console.log('blogpost : - ' + blogPost);
// Optional: view the final string
// const blogPost = `Node.js is a JavaScript runtime built on Chrome's V8 engine. 
// It lets developers use JavaScript to write command line tools and for server-side scripting. 
// This makes it a powerful tool for full-stack development. 
// Because Node.js uses a non-blocking I/O model, it's very efficient and scalable. 
// It has a vibrant ecosystem with npm and is widely used in microservices, APIs, and real-time applications.`;

blogToVideo(blogPost, 'assets/music.mp3');
