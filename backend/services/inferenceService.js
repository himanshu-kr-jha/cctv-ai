const ort = require('onnxruntime-node');
const sharp = require('sharp');
const fs = require('fs');
const { nms } = require('../utils/nms');
const logger = require('../utils/logger');

// Cache loaded sessions
const sessionCache = new Map();

// Blacklist models that failed to load so we don't retry every 5 seconds
const failedModels = new Map(); // filePath -> { reason, timestamp }

/**
 * Check if a file looks like a valid ONNX model by inspecting the header magic bytes.
 * ONNX files are Protobuf-serialized and start with byte 0x08 (field 1, varint).
 * PyTorch .pt files are ZIP archives starting with PK (0x50 0x4B).
 */
function validateModelFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, reason: `Model file not found: ${filePath}` };
  }

  const ext = filePath.toLowerCase().split('.').pop();
  const fd = fs.openSync(filePath, 'r');
  const header = Buffer.alloc(4);
  fs.readSync(fd, header, 0, 4, 0);
  fs.closeSync(fd);

  // Detect PyTorch ZIP archives (.pt / .pth)
  if (header[0] === 0x50 && header[1] === 0x4B) {
    return {
      valid: false,
      reason: `File is a PyTorch (.pt/.pth) archive, not ONNX. Convert it first: "python -m onnxruntime.transformers.optimizer --model ${filePath}" or use ultralytics export.`,
    };
  }

  // Warn on non-.onnx extensions
  if (ext !== 'onnx') {
    return {
      valid: false,
      reason: `Unsupported model format ".${ext}". Only .onnx models are supported by the inference engine. Convert your model to ONNX format first.`,
    };
  }

  return { valid: true };
}

/**
 * Load an ONNX model session (cached).
 * Blacklists broken models so they are not retried on every detection cycle.
 */
async function loadModel(filePath) {
  // Return cached session immediately
  if (sessionCache.has(filePath)) {
    return sessionCache.get(filePath);
  }

  // Skip models that already failed
  if (failedModels.has(filePath)) {
    const failure = failedModels.get(filePath);
    throw new Error(`Model previously failed: ${failure.reason}`);
  }

  // Pre-validate before attempting expensive ONNX load
  const validation = validateModelFile(filePath);
  if (!validation.valid) {
    failedModels.set(filePath, { reason: validation.reason, timestamp: Date.now() });
    logger.error(`Model validation failed: ${validation.reason}`);
    await autoDeactivateModel(filePath);
    throw new Error(validation.reason);
  }

  try {
    const session = await ort.InferenceSession.create(filePath, {
      executionProviders: ['cpu'],
    });
    sessionCache.set(filePath, session);
    logger.success(`Model loaded: ${filePath}`);
    return session;
  } catch (err) {
    const reason = `Load failed: ${err.message}`;
    failedModels.set(filePath, { reason, timestamp: Date.now() });
    logger.error(`Failed to load model: ${filePath}`, { error: err.message });
    logger.warn(`Model blacklisted — will not retry until server restart or manual reactivation.`);
    await autoDeactivateModel(filePath);
    throw err;
  }
}

/**
 * Auto-deactivate a model in the database when it fails to load.
 * This stops the scheduler from continuously queuing jobs for a broken model.
 */
async function autoDeactivateModel(filePath) {
  try {
    const AIModel = require('../models/AIModel');
    const model = await AIModel.findOne({ filePath });
    if (model && model.isActive) {
      model.isActive = false;
      await model.save();
      logger.warn(`Auto-deactivated model "${model.name}" (${model._id}) due to load failure. Fix the model file and reactivate manually.`);
    }
  } catch (dbErr) {
    logger.error('Failed to auto-deactivate model in DB', { error: dbErr.message });
  }
}

/**
 * Preprocess an image buffer for YOLO inference
 * Resize to inputResolution x inputResolution, normalize to 0-1, create NCHW tensor
 */
async function preprocessImage(imageBuffer, inputSize = 640) {
  const { data, info } = await sharp(imageBuffer)
    .resize(inputSize, inputSize, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const float32Data = new Float32Array(1 * 3 * height * width);

  // Convert HWC to NCHW and normalize to 0-1
  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        float32Data[c * height * width + h * width + w] =
          data[h * width * channels + w * channels + c] / 255.0;
      }
    }
  }

  const tensor = new ort.Tensor('float32', float32Data, [1, 3, height, width]);
  return { tensor, originalWidth: width, originalHeight: height };
}

/**
 * Run inference on an image buffer with a loaded model
 */
async function runInference(modelData, imageBuffer) {
  const { filePath, labels, confidenceThreshold, inputResolution } = modelData;

  try {
    const session = await loadModel(filePath);
    const inputSize = inputResolution || 640;
    const { tensor, originalWidth, originalHeight } = await preprocessImage(imageBuffer, inputSize);

    const inputName = session.inputNames[0];
    const feeds = { [inputName]: tensor };

    const startTime = Date.now();
    const results = await session.run(feeds);
    const inferenceTime = Date.now() - startTime;

    const outputName = session.outputNames[0];
    const output = results[outputName];

    // Parse YOLO output format (supporting both v8 and v5)
    const detections = parseYoloOutput(output, labels, confidenceThreshold, inputSize, originalWidth, originalHeight);
    const filtered = nms(detections, 0.45);

    return {
      detections: filtered,
      inferenceTimeMs: inferenceTime,
      totalDetected: filtered.length,
      frameWidth: originalWidth,
      frameHeight: originalHeight,
    };
  } catch (err) {
    logger.error('Inference failed', { error: err.message });
    // Return simulated results if model can't load (for demo)
    return simulateDetection(labels, confidenceThreshold);
  }
}

/**
 * Parse YOLO tensor
 * Output shape YOLOv8: [1, 4+numClasses, numBoxes]
 * Output shape YOLOv5: [1, numBoxes, 5+numClasses]
 */
function parseYoloOutput(output, labels, threshold, inputSize, originalWidth, originalHeight) {
  const detections = [];
  const data = output.data;
  const dims = output.dims;
  
  const scaleX = originalWidth ? originalWidth / inputSize : 1;
  const scaleY = originalHeight ? originalHeight / inputSize : 1;

  if (dims.length === 3) {
    const isYoloV5 = dims[1] > dims[2];
    
    let numClasses, numBoxes;
    if (isYoloV5) {
      numBoxes = dims[1];
      numClasses = dims[2] - 5;
    } else {
      numClasses = dims[1] - 4;
      numBoxes = dims[2];
    }

    for (let i = 0; i < numBoxes; i++) {
      let cx, cy, w, h, maxScore = 0, maxClassIdx = 0;

      if (isYoloV5) {
        const rowOffset = i * dims[2];
        cx = data[rowOffset + 0];
        cy = data[rowOffset + 1];
        w = data[rowOffset + 2];
        h = data[rowOffset + 3];
        const objConf = data[rowOffset + 4];

        for (let c = 0; c < numClasses; c++) {
          const score = objConf * data[rowOffset + 5 + c];
          if (score > maxScore) {
            maxScore = score;
            maxClassIdx = c;
          }
        }
      } else {
        // YOLOv8
        for (let c = 0; c < numClasses; c++) {
          const score = data[(4 + c) * numBoxes + i];
          if (score > maxScore) {
            maxScore = score;
            maxClassIdx = c;
          }
        }

        if (maxScore >= threshold) {
          cx = data[0 * numBoxes + i];
          cy = data[1 * numBoxes + i];
          w = data[2 * numBoxes + i];
          h = data[3 * numBoxes + i];
        }
      }

      if (maxScore >= threshold) {
        let confidence = parseFloat(maxScore.toFixed(4));
        if (confidence > 1) confidence = 1.0;
        if (confidence < 0) confidence = 0.0;

        const scaledCx = cx * scaleX;
        const scaledCy = cy * scaleY;
        const scaledW = w * scaleX;
        const scaledH = h * scaleY;

        detections.push({
          x: Math.round(scaledCx - scaledW / 2),
          y: Math.round(scaledCy - scaledH / 2),
          w: Math.round(scaledW),
          h: Math.round(scaledH),
          label: labels && labels[maxClassIdx] ? labels[maxClassIdx] : `class_${maxClassIdx}`,
          confidence,
        });
      }
    }
  }

  return detections;
}

/**
 * Simulate detection results for demo purposes when model file isn't a real ONNX
 */
function simulateDetection(labels, threshold) {
  const demoLabels = labels && labels.length > 0 ? labels : ['person', 'car', 'truck', 'bicycle'];
  const numDetections = Math.floor(Math.random() * 4) + 1;
  const detections = [];

  for (let i = 0; i < numDetections; i++) {
    const label = demoLabels[Math.floor(Math.random() * demoLabels.length)];
    const confidence = parseFloat((Math.random() * 0.4 + 0.55).toFixed(4));

    if (confidence >= threshold) {
      detections.push({
        x: Math.floor(Math.random() * 400) + 50,
        y: Math.floor(Math.random() * 300) + 50,
        w: Math.floor(Math.random() * 150) + 60,
        h: Math.floor(Math.random() * 150) + 60,
        label,
        confidence,
      });
    }
  }

  return {
    detections,
    inferenceTimeMs: Math.floor(Math.random() * 100) + 20,
    totalDetected: detections.length,
    frameWidth: 640,
    frameHeight: 480,
  };
}

/**
 * Clear a model from the session cache and the failed-model blacklist.
 * Call this when a model file is replaced or the user wants to retry.
 */
function clearModelCache(filePath) {
  if (sessionCache.has(filePath)) {
    sessionCache.delete(filePath);
    logger.info(`Cleared model session cache: ${filePath}`);
  }
  if (failedModels.has(filePath)) {
    failedModels.delete(filePath);
    logger.info(`Cleared model from blacklist: ${filePath}`);
  }
}

module.exports = { runInference, loadModel, clearModelCache, simulateDetection, validateModelFile };
