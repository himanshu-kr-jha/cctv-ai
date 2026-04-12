const AIModel = require('../models/AIModel');
const { asyncHandler } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

// GET /api/models
exports.listModels = asyncHandler(async (req, res) => {
  const models = await AIModel.find().sort({ createdAt: -1 }).populate('uploadedBy', 'name email');
  res.json(models);
});

// GET /api/models/:id
exports.getModel = asyncHandler(async (req, res) => {
  const model = await AIModel.findById(req.params.id).populate('uploadedBy', 'name email');
  if (!model) return res.status(404).json({ message: 'Model not found' });
  res.json(model);
});

// POST /api/models
exports.createModel = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Model file is required' });
  }

  const { name, labels, alertLabels, confidenceThreshold, inputResolution, modelType, description } = req.body;

  const model = await AIModel.create({
    name: name || req.file.originalname,
    labels: labels ? (typeof labels === 'string' ? JSON.parse(labels) : labels) : [],
    alertLabels: alertLabels ? (typeof alertLabels === 'string' ? JSON.parse(alertLabels) : alertLabels) : [],
    confidenceThreshold: confidenceThreshold ? parseFloat(confidenceThreshold) : 0.5,
    inputResolution: inputResolution ? parseInt(inputResolution) : 640,
    filePath: req.file.path,
    fileSize: req.file.size,
    modelType: modelType || 'onnx',
    description: description || '',
    uploadedBy: req.user._id,
  });

  res.status(201).json(model);
});

// PUT /api/models/:id
exports.updateModel = asyncHandler(async (req, res) => {
  const { name, labels, alertLabels, confidenceThreshold, inputResolution, modelType, description } = req.body;

  const model = await AIModel.findById(req.params.id);
  if (!model) return res.status(404).json({ message: 'Model not found' });

  if (name) model.name = name;
  if (labels) model.labels = typeof labels === 'string' ? JSON.parse(labels) : labels;
  if (alertLabels) model.alertLabels = typeof alertLabels === 'string' ? JSON.parse(alertLabels) : alertLabels;
  if (confidenceThreshold) model.confidenceThreshold = parseFloat(confidenceThreshold);
  if (inputResolution) model.inputResolution = parseInt(inputResolution);
  if (modelType) model.modelType = modelType;
  if (description !== undefined) model.description = description;

  await model.save();
  res.json(model);
});

// PATCH /api/models/:id/toggle
exports.toggleModel = asyncHandler(async (req, res) => {
  const model = await AIModel.findById(req.params.id);
  if (!model) return res.status(404).json({ message: 'Model not found' });

  model.isActive = !model.isActive;
  await model.save();

  const io = req.app.get('io');
  if (io) io.to('dashboard').emit('model-updated', { modelId: model._id, isActive: model.isActive });

  res.json(model);
});

// DELETE /api/models/:id
exports.deleteModel = asyncHandler(async (req, res) => {
  const model = await AIModel.findById(req.params.id);
  if (!model) return res.status(404).json({ message: 'Model not found' });

  // Delete file from disk
  if (model.filePath && fs.existsSync(model.filePath)) {
    fs.unlinkSync(model.filePath);
  }

  await AIModel.findByIdAndDelete(req.params.id);
  res.json({ message: 'Model deleted' });
});
