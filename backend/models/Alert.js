const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
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
    detectedLabel: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    snapshotPath: {
      type: String,
      default: '',
    },
    boundingBoxes: [
      {
        x: Number,
        y: Number,
        w: Number,
        h: Number,
        label: String,
        confidence: Number,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
alertSchema.index({ createdAt: -1 });
alertSchema.index({ camera: 1, createdAt: -1 });
alertSchema.index({ detectedLabel: 1 });
alertSchema.index({ severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);
