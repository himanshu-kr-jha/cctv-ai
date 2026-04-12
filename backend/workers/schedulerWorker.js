const cron = require('node-cron');
const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const Camera = require('../models/Camera');
const logger = require('../utils/logger');
const { startDetectionWorker, setIO } = require('./detectionWorker');

let detectionQueue = null;
let isProcessing = false;

function startScheduler() {
  try {
    const connection = getRedisConnection();
    detectionQueue = new Queue('detection-queue', { connection });

    // Start the worker in the same process
    startDetectionWorker();

    // Run every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
      if (isProcessing) return; // Skip if previous cycle still running
      isProcessing = true;

      try {
        const activeCameras = await Camera.find({ isDetecting: true, isOnline: true });

        for (const camera of activeCameras) {
          if (!camera.assignedModel) continue;

          // Add job with deduplication (jobId based on camera to prevent duplicates)
          await detectionQueue.add(
            'detect',
            { cameraId: camera._id.toString() },
            {
              jobId: `detect-${camera._id}-${Date.now()}`,
              removeOnComplete: true,
              removeOnFail: true,
              attempts: 1,
            }
          );
        }

        if (activeCameras.length > 0) {
          logger.debug(`Queued detection for ${activeCameras.length} cameras`);
        }
      } catch (err) {
        logger.error('Scheduler error', { error: err.message });
      } finally {
        isProcessing = false;
      }
    });

    logger.success('Detection scheduler started (every 5 seconds)');
  } catch (err) {
    logger.error('Failed to start scheduler', { error: err.message });
    // Run without Redis/BullMQ — direct detection
    startDirectScheduler();
  }
}

/**
 * Fallback scheduler without BullMQ (runs detection directly)
 */
function startDirectScheduler() {
  const { runDetectionPipeline } = require('../services/detectionService');

  cron.schedule('*/5 * * * * *', async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const activeCameras = await Camera.find({ isDetecting: true, isOnline: true });

      for (const camera of activeCameras) {
        if (!camera.assignedModel) continue;
        await runDetectionPipeline(camera._id.toString(), null);
      }
    } catch (err) {
      logger.error('Direct scheduler error', { error: err.message });
    } finally {
      isProcessing = false;
    }
  });

  logger.warn('Running direct scheduler (no Redis/BullMQ)');
}

module.exports = { startScheduler };
