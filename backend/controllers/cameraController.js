const Camera = require('../models/Camera');
const AIModel = require('../models/AIModel');
const { asyncHandler } = require('../utils/helpers');
const { startWebcamStream, stopWebcamStream } = require('../services/webcamService');

// GET /api/cameras
exports.listCameras = asyncHandler(async (req, res) => {
  const cameras = await Camera.find()
    .sort({ createdAt: -1 })
    .populate('assignedModel', 'name modelType isActive labels')
    .populate('createdBy', 'name');
  res.json(cameras);
});

// GET /api/cameras/:id
exports.getCamera = asyncHandler(async (req, res) => {
  const camera = await Camera.findById(req.params.id)
    .populate('assignedModel')
    .populate('createdBy', 'name');
  if (!camera) return res.status(404).json({ message: 'Camera not found' });
  res.json(camera);
});

// POST /api/cameras
exports.createCamera = asyncHandler(async (req, res) => {
  const { name, sourceType, sourceUrl, assignedModel } = req.body;

  if (!name) return res.status(400).json({ message: 'Camera name is required' });

  const camera = await Camera.create({
    name,
    sourceType: sourceType || 'sample',
    sourceUrl: sourceUrl || '',
    assignedModel: assignedModel || null,
    createdBy: req.user._id,
  });

  const populated = await Camera.findById(camera._id)
    .populate('assignedModel', 'name modelType isActive labels')
    .populate('createdBy', 'name');

  const io = req.app.get('io');
  if (io) io.to('dashboard').emit('camera-added', populated);

  res.status(201).json(populated);
});

// PUT /api/cameras/:id
exports.updateCamera = asyncHandler(async (req, res) => {
  const { name, sourceType, sourceUrl } = req.body;
  const camera = await Camera.findById(req.params.id);
  if (!camera) return res.status(404).json({ message: 'Camera not found' });

  if (name) camera.name = name;
  if (sourceType) camera.sourceType = sourceType;
  if (sourceUrl !== undefined) camera.sourceUrl = sourceUrl;

  await camera.save();
  const populated = await Camera.findById(camera._id)
    .populate('assignedModel', 'name modelType isActive labels')
    .populate('createdBy', 'name');
  res.json(populated);
});

// PATCH /api/cameras/:id/model
exports.assignModel = asyncHandler(async (req, res) => {
  const { modelId } = req.body;
  const camera = await Camera.findById(req.params.id);
  if (!camera) return res.status(404).json({ message: 'Camera not found' });

  if (modelId) {
    const model = await AIModel.findById(modelId);
    if (!model) return res.status(404).json({ message: 'Model not found' });
    camera.assignedModel = modelId;
  } else {
    camera.assignedModel = null;
  }

  await camera.save();
  const populated = await Camera.findById(camera._id)
    .populate('assignedModel', 'name modelType isActive labels')
    .populate('createdBy', 'name');

  const io = req.app.get('io');
  if (io) io.to('dashboard').emit('model-assigned', { cameraId: camera._id, model: populated.assignedModel });

  res.json(populated);
});

// POST /api/cameras/:id/start
exports.startDetection = asyncHandler(async (req, res) => {
  const camera = await Camera.findById(req.params.id).populate('assignedModel');
  if (!camera) return res.status(404).json({ message: 'Camera not found' });
  if (!camera.assignedModel) return res.status(400).json({ message: 'No model assigned to this camera' });
  if (!camera.assignedModel.isActive) return res.status(400).json({ message: 'Assigned model is inactive' });

  camera.isDetecting = true;
  camera.isOnline = true;
  await camera.save();

  if (camera.sourceType === 'webcam') {
    startWebcamStream(camera._id, camera.sourceUrl);
  }

  const io = req.app.get('io');
  if (io) io.to('dashboard').emit('detection-status', { cameraId: camera._id, status: 'started' });

  res.json({ message: 'Detection started', camera });
});

// POST /api/cameras/:id/stop
exports.stopDetection = asyncHandler(async (req, res) => {
  const camera = await Camera.findById(req.params.id);
  if (!camera) return res.status(404).json({ message: 'Camera not found' });

  camera.isDetecting = false;
  camera.fps = 0;
  await camera.save();

  if (camera.sourceType === 'webcam') {
    stopWebcamStream(camera._id);
  }

  const io = req.app.get('io');
  if (io) io.to('dashboard').emit('detection-status', { cameraId: camera._id, status: 'stopped' });

  res.json({ message: 'Detection stopped', camera });
});

// GET /api/cameras/:id/stream — Stream the camera's video source
exports.streamVideo = asyncHandler(async (req, res) => {
  const camera = await Camera.findById(req.params.id);
  if (!camera) return res.status(404).json({ message: 'Camera not found' });

  const fs = require('fs');
  const path = require('path');

  let filePath = camera.sourceUrl;

  // Resolve sample paths relative to streams/samples
  if (camera.sourceType === 'sample') {
    filePath = path.join(__dirname, '..', 'streams', 'samples', camera.sourceUrl);
  }

  // For 'file' type, sourceUrl should be an absolute path already
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Video source file not found', path: filePath });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// DELETE /api/cameras/:id
exports.deleteCamera = asyncHandler(async (req, res) => {
  const camera = await Camera.findById(req.params.id);
  if (!camera) return res.status(404).json({ message: 'Camera not found' });

  // Stop detection first
  camera.isDetecting = false;
  await camera.save();

  if (camera.sourceType === 'webcam') {
    stopWebcamStream(camera._id);
  }

  await Camera.findByIdAndDelete(req.params.id);

  const io = req.app.get('io');
  if (io) io.to('dashboard').emit('camera-removed', { cameraId: req.params.id });

  res.json({ message: 'Camera deleted' });
});
