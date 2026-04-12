const mongoose = require('mongoose');

const detectionLogSchema = new mongoose.Schema(
  {
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera',
      required: true,
    },
    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIModel',
      required: true,
    },
    objectsDetected: {
      type: Number,
      default: 0,
    },
    inferenceTimeMs: {
      type: Number,
      default: 0,
    },
    labels: {
      type: [String],
      default: [],
    },
    frameTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

detectionLogSchema.index({ createdAt: -1 });
detectionLogSchema.index({ camera: 1, createdAt: -1 });

module.exports = mongoose.model('DetectionLog', detectionLogSchema);
