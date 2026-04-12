const Camera = require('../models/Camera');
const AIModel = require('../models/AIModel');
const Alert = require('../models/Alert');
const DetectionLog = require('../models/DetectionLog');
const { captureFrame } = require('./frameService');
const { runInference } = require('./inferenceService');
const { annotateImage } = require('./annotationService');
const { severityFromConfidence } = require('../utils/helpers');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Full detection pipeline for a single camera
 * 1. Capture frame
 * 2. Run inference
 * 3. Annotate image if detections found
 * 4. Save alert
 * 5. Emit socket event
 */
async function runDetectionPipeline(cameraId, io) {
  const camera = await Camera.findById(cameraId).populate('assignedModel');
  if (!camera || !camera.isDetecting || !camera.assignedModel) {
    return null;
  }

  const model = camera.assignedModel;
  if (!model.isActive) {
    logger.warn(`Model ${model.name} is inactive, skipping detection for camera ${camera.name}`);
    return null;
  }

  const startTime = Date.now();

  try {
    // 1. Capture frame
    const framePath = await captureFrame(camera.sourceUrl, camera.sourceType, camera._id);

    // 2. Run inference
    const result = await runInference(
      {
        filePath: model.filePath,
        labels: model.labels,
        confidenceThreshold: model.confidenceThreshold,
        inputResolution: model.inputResolution,
      },
      require('fs').readFileSync(framePath)
    );

    const totalTime = Date.now() - startTime;

    // 3. Log the detection
    await DetectionLog.create({
      camera: camera._id,
      model: model._id,
      objectsDetected: result.totalDetected,
      inferenceTimeMs: result.inferenceTimeMs,
      labels: result.detections.map((d) => d.label),
      frameTimestamp: new Date(),
    });

    // Update camera stats
    camera.lastDetectionAt = new Date();
    camera.fps = Math.round(1000 / totalTime);
    await camera.save();

    // 4. If objects detected, annotate and (maybe) create alert
    if (result.detections.length > 0) {
      const snapshotPath = await annotateImage(framePath, result.detections);
      const relativePath = path.relative(path.join(__dirname, '..'), snapshotPath);

      // Determine which detections are actually "alerts"
      // If the model explicitly provides alertLabels, restrict alerts to only those labels.
      // Otherwise, default to saving all detections as alerts.
      const alertableDetections = result.detections.filter(d => {
        if (model.alertLabels && model.alertLabels.length > 0) {
          return model.alertLabels.find(l => l.toLowerCase() === d.label.toLowerCase());
        }
        return true;
      });

      let populatedAlert = null;
      let alertId = null;

      if (alertableDetections.length > 0) {
        // Create alert for top alertable detection
        const topDetection = alertableDetections.reduce(
          (max, d) => (d.confidence > max.confidence ? d : max),
          alertableDetections[0]
        );

        const alert = await Alert.create({
          camera: camera._id,
          model: model._id,
          detectedLabel: topDetection.label,
          confidence: topDetection.confidence,
          severity: severityFromConfidence(topDetection.confidence),
          snapshotPath: relativePath,
          boundingBoxes: result.detections,
        });

        alertId = alert._id;

        // Populate for socket emission
        populatedAlert = await Alert.findById(alert._id)
          .populate('camera', 'name sourceType')
          .populate('model', 'name modelType');

        if (io) {
          io.to('dashboard').emit('new-alert', populatedAlert);
          io.to('dashboard').emit('stats-update', {
            alertsToday: await Alert.countDocuments({
              createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            }),
          });
        }
      }

      // 5. Emit socket event for general status update
      if (io) {
        io.to('dashboard').emit('detection-status', {
          cameraId: camera._id,
          status: alertId ? 'detected' : 'scanning',
          fps: camera.fps,
          detections: result.totalDetected,
          boundingBoxes: result.detections,
          frameWidth: result.frameWidth,
          frameHeight: result.frameHeight,
          alertLabels: model.alertLabels || [],
          inferenceTimeMs: result.inferenceTimeMs,
        });
      }

      const detectionSummary = result.detections
        .map(d => `${d.label} (${(d.confidence * 100).toFixed(1)}%)`)
        .join(', ');

      logger.success(
        `Detection: ${result.totalDetected} objects on ${camera.name} (${result.inferenceTimeMs}ms) -> [${detectionSummary}]`
      );

      // Clean up original frame (keep annotated)
      try {
        if (framePath !== snapshotPath) require('fs').unlinkSync(framePath);
      } catch (_) {}

      return { alert: populatedAlert, detections: result.detections };
    } else {
      // No detections — emit status update
      if (io) {
        io.to('dashboard').emit('detection-status', {
          cameraId: camera._id,
          status: 'scanning',
          fps: camera.fps,
          detections: 0,
          boundingBoxes: [],
          alertLabels: model.alertLabels || [],
          inferenceTimeMs: result.inferenceTimeMs,
        });
      }

      // Clean up frame
      try {
        require('fs').unlinkSync(framePath);
      } catch (_) {}

      return null;
    }
  } catch (err) {
    logger.error(`Detection pipeline error for camera ${camera.name}`, { error: err.message });

    if (io) {
      io.to('dashboard').emit('detection-status', {
        cameraId: camera._id,
        status: 'error',
        error: err.message,
      });
    }

    return null;
  }
}

module.exports = { runDetectionPipeline };
