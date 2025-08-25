const fs = require('fs');
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { createCanvas } = require('canvas');

ffmpeg.setFfmpegPath(ffmpegPath);

// Generate audio using Google TTS
async function generateAudio(text, outputPath) {
  const client = new textToSpeech.TextToSpeechClient();
  const request = {
    input: { text },
    voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };
  const [response] = await client.synthesizeSpeech(request);
  await util.promisify(fs.writeFile)(outputPath, response.audioContent, 'binary');
  console.log(`Audio saved to ${outputPath}`);
}

// Create image from text (basic visual)
async function createImage(text, outputPath) {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#FFF';
  ctx.font = '40px Sans';
  const lines = text.match(/.{1,60}/g); // wrap lines
  lines.forEach((line, i) => {
    ctx.fillText(line, 50, 100 + i * 60);
  });
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Image saved to ${outputPath}`);
}

// Combine audio and image into a video
async function createVideo(imagePath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    // ffmpeg()
    //   .addInput(imagePath)
    //   .loop()
    //   .addInput(audioPath)
    //   .outputOptions(['-c:v libx264', '-c:a aac', '-shortest'])
    //   .save(outputPath)
    ffmpeg()
  .addInput(imagePath)
  .loop() // This loops forever unless duration is set
  .addInput(audioPath)
  .outputOptions([
    '-map 0:v:0',
    '-map 1:a:0',
    '-c:v libx264',
    '-c:a aac',
    '-preset veryfast',
    '-shortest',
    '-movflags +faststart'
  ])
  .save(outputPath)
      .on('end', () => {
        console.log(`Video saved to ${outputPath}`);
        resolve();
      })
      .on('error', reject);
  });
}

// Main
async function blogToVideo(blogText) {
  const audioPath = 'output/audio.mp3';
  const imagePath = 'output/image.png';
  const videoPath = 'output/blog-video.mp4';
  if (!fs.existsSync('output')) fs.mkdirSync('output');

  await generateAudio(blogText, audioPath);
  await createImage(blogText, imagePath);
  await createVideo(imagePath, audioPath, videoPath);

}


// Example usage
const blogPost = `Node.js is a JavaScript runtime built on Chrome's V8 engine. 
It lets developers use JavaScript to write command line tools and for server-side scripting. 
This makes it a powerful tool for full-stack development.`;

blogToVideo(blogPost);
 
