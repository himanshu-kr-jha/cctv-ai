const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const TEMP_DIR = path.join(__dirname, '..', 'uploads', 'snapshots');
const activeStreams = new Map();

function startWebcamStream(cameraId, sourceUrl) {
  if (activeStreams.has(cameraId.toString())) {
    return activeStreams.get(cameraId.toString()).outputPath;
  }

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const outputPath = path.join(TEMP_DIR, `live_${cameraId}.jpg`);
  logger.info(`Starting continuous webcam stream for camera ${cameraId} on ${sourceUrl}`);

  // Continuously overwrite the same file at 10fps
  const cmd = `ffmpeg -y -f v4l2 -framerate 10 -i "${sourceUrl}" -update 1 "${outputPath}"`;

  const child = exec(cmd, (error) => {
    if (error) {
      if (error.killed) {
        logger.info(`Webcam stream stopped successfully for ${cameraId}`);
      } else {
        logger.error(`Webcam stream error for ${cameraId}: ${error.message}`);
      }
    }
    activeStreams.delete(cameraId.toString());
  });

  activeStreams.set(cameraId.toString(), { process: child, outputPath });
  return outputPath;
}

function stopWebcamStream(cameraId) {
  const stream = activeStreams.get(cameraId.toString());
  if (stream) {
    logger.info(`Stopping continuous webcam stream for camera ${cameraId}`);
    stream.process.kill();
    activeStreams.delete(cameraId.toString());
  }
}

function getWebcamSnapshotPath(cameraId) {
  const stream = activeStreams.get(cameraId.toString());
  if (stream && fs.existsSync(stream.outputPath)) {
    return stream.outputPath;
  }
  return null;
}

module.exports = { startWebcamStream, stopWebcamStream, getWebcamSnapshotPath };
