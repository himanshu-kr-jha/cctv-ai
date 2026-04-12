const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { getWebcamSnapshotPath } = require('./webcamService');

const TEMP_DIR = path.join(__dirname, '..', 'uploads', 'snapshots');

/**
 * Capture a single frame from a video source using FFmpeg
 * Supports: file paths, RTSP URLs, sample videos
 */
async function captureFrame(sourceUrl, sourceType = 'file', cameraId = null) {
  // Ensure temp dir exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const outputPath = path.join(TEMP_DIR, `frame_${uuidv4()}.jpg`);

  let inputPath = sourceUrl;

  // Handle sample type — resolve relative to streams/samples
  if (sourceType === 'sample') {
    inputPath = path.join(__dirname, '..', 'streams', 'samples', sourceUrl);
  }

  // Check file exists for file/sample types
  if ((sourceType === 'file' || sourceType === 'sample') && !fs.existsSync(inputPath)) {
    logger.warn(`Video source not found: ${inputPath}, generating placeholder frame`);
    return generatePlaceholderFrame(outputPath);
  }

  // Fast path for continuous webcams
  if (sourceType === 'webcam' && cameraId) {
    const livePath = getWebcamSnapshotPath(cameraId);
    if (livePath) {
      try {
        fs.copyFileSync(livePath, outputPath);
        return outputPath;
      } catch (err) {
        logger.warn(`Failed to copy live webcam frame for ${cameraId}$, generating placeholder. Error: ${err.message}`);
        return generatePlaceholderFrame(outputPath);
      }
    } else {
      logger.warn(`Webcam stream for ${cameraId} not ready yet, generating placeholder.`);
      return generatePlaceholderFrame(outputPath);
    }
  }

  return new Promise((resolve, reject) => {
    let inputArgs = `-i "${inputPath}"`;
    let seekTime = '';

    if (sourceType === 'rtsp') {
      // No seek for live RTSP
    } else {
      seekTime = `-ss ${Math.floor(Math.random() * 5)}`;
    }

    const cmd = `ffmpeg -y ${seekTime} ${inputArgs} -vframes 1 -q:v 2 "${outputPath}" 2>/dev/null`;

    exec(cmd, { timeout: 10000 }, (error) => {
      if (error || !fs.existsSync(outputPath)) {
        logger.warn('FFmpeg frame capture failed, generating placeholder');
        generatePlaceholderFrame(outputPath).then(resolve).catch(reject);
      } else {
        resolve(outputPath);
      }
    });
  });
}

/**
 * Generate a placeholder frame (gradient image) when actual video isn't available
 */
async function generatePlaceholderFrame(outputPath) {
  const sharp = require('sharp');

  // Create a simple 640x480 gradient image as a placeholder
  const width = 640;
  const height = 480;
  const channels = 3;
  const buf = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      buf[idx] = Math.floor((x / width) * 100) + 30;     // R
      buf[idx + 1] = Math.floor((y / height) * 100) + 50; // G
      buf[idx + 2] = 120 + Math.floor(Math.sin(x * 0.05) * 30); // B
    }
  }

  await sharp(buf, { raw: { width, height, channels } })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  return outputPath;
}

module.exports = { captureFrame, generatePlaceholderFrame };
