const { Worker } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const { runDetectionPipeline } = require('../services/detectionService');
const logger = require('../utils/logger');

let io = null;

function setIO(socketIO) {
  io = socketIO;
}

function startDetectionWorker() {
  const connection = getRedisConnection();

  const worker = new Worker(
    'detection-queue',
    async (job) => {
      const { cameraId } = job.data;
      logger.debug(`Processing detection job for camera: ${cameraId}`);

      const result = await runDetectionPipeline(cameraId, io);
      return result ? { success: true, cameraId } : { success: false, cameraId, reason: 'no_detections_or_skipped' };
    },
    {
      connection,
      concurrency: 3,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    }
  );

  worker.on('completed', (job, result) => {
    if (result?.success) {
      logger.debug(`Detection job completed: ${job.id}`);
    }
  });

  worker.on('failed', (job, err) => {
    logger.error(`Detection job failed: ${job?.id}`, { error: err.message });
  });

  worker.on('error', (err) => {
    logger.error('Detection worker error', { error: err.message });
  });

  logger.success('Detection worker started');
  return worker;
}

module.exports = { startDetectionWorker, setIO };
