const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const SNAPSHOT_DIR = path.join(__dirname, '..', 'uploads', 'snapshots');

// Color palette for different labels
const COLORS = {
  person: '#FF4444',
  car: '#44AAFF',
  truck: '#FFAA44',
  bicycle: '#44FF44',
  motorcycle: '#FF44FF',
  bus: '#FFFF44',
  dog: '#FF8844',
  cat: '#44FFAA',
  default: '#00FFFF',
};

/**
 * Draw bounding boxes on an image using sharp + SVG overlay
 */
async function annotateImage(imagePath, detections) {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    // Build SVG overlay with bounding boxes
    const svgRects = detections
      .map((det) => {
        const color = COLORS[det.label.toLowerCase()] || COLORS.default;
        const labelText = `${det.label} ${(det.confidence * 100).toFixed(1)}%`;
        const fontSize = Math.max(12, Math.round(width / 50));
        const strokeWidth = Math.max(2, Math.round(width / 300));
        const textBgHeight = fontSize + 8;
        const textBgWidth = labelText.length * fontSize * 0.6 + 10;

        return `
          <rect x="${det.x}" y="${det.y}" width="${det.w}" height="${det.h}"
            fill="none" stroke="${color}" stroke-width="${strokeWidth}" rx="3"/>
          <rect x="${det.x}" y="${Math.max(0, det.y - textBgHeight)}" width="${textBgWidth}" height="${textBgHeight}"
            fill="${color}" rx="3"/>
          <text x="${det.x + 5}" y="${Math.max(fontSize, det.y - 4)}"
            font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">
            ${labelText}
          </text>
          <rect x="${det.x}" y="${det.y}" width="${det.w}" height="${det.h}"
            fill="${color}" opacity="0.12" rx="3"/>
        `;
      })
      .join('');

    // Add timestamp watermark
    const timestamp = new Date().toLocaleString();
    const tsSize = Math.max(11, Math.round(width / 55));
    const watermark = `
      <rect x="${width - 200}" y="${height - 28}" width="195" height="24" fill="rgba(0,0,0,0.6)" rx="4"/>
      <text x="${width - 195}" y="${height - 10}" font-family="monospace" font-size="${tsSize}" fill="white">${timestamp}</text>
    `;

    const svgOverlay = Buffer.from(`
      <svg width="${width}" height="${height}">
        ${svgRects}
        ${watermark}
      </svg>
    `);

    const outputFilename = `annotated_${uuidv4()}.jpg`;
    const outputPath = path.join(SNAPSHOT_DIR, outputFilename);

    await sharp(imageBuffer)
      .composite([{ input: svgOverlay, top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    return outputPath;
  } catch (err) {
    logger.error('Image annotation failed', { error: err.message });
    // Copy original image as fallback
    const fallbackName = `snap_${uuidv4()}.jpg`;
    const fallbackPath = path.join(SNAPSHOT_DIR, fallbackName);
    try {
      fs.copyFileSync(imagePath, fallbackPath);
      return fallbackPath;
    } catch (_) {
      return imagePath;
    }
  }
}

module.exports = { annotateImage };
