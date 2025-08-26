const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const axios = require('axios');
const logger = require('../utils/logger');

async function downloadImage(url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
    });
    fs.writeFileSync(outputPath, response.data);
    logger.info(`Downloaded image to ${outputPath}`);
  } catch (error) {
    logger.error(`Failed to download image from ${url}`, error);
    throw error;
  }
}

async function createImageWithBackground(text, outputPath) {
  try {
    const canvas = createCanvas(1280, 720);
    const ctx = canvas.getContext('2d');

    const background = await loadImage('assets/Resumes/Visionary.png');
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(80, 180, 1120, 360);

    ctx.fillStyle = '#000';
    ctx.font = '32px Sans';
    ctx.textAlign = 'center';

    const wrapText = (context, textToWrap, maxWidth) => {
      const words = textToWrap.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(`${currentLine} ${word}`).width;
        if (width < maxWidth) {
          currentLine += ` ${word}`;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const lines = wrapText(ctx, text, 1000);
    const lineHeight = 50;
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalHeight) / 2 + lineHeight;

    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    logger.info(`Image with background saved to ${outputPath}`);
  } catch (error) {
    logger.error('Failed to create image with background', error);
    throw error;
  }
}

module.exports = {
  downloadImage,
  createImageWithBackground,
};
