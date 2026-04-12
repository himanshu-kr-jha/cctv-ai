const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Camera name is required'],
      trim: true,
      maxlength: 200,
    },
    sourceType: {
      type: String,
      enum: ['webcam', 'rtsp', 'file', 'sample'],
      default: 'sample',
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    assignedModel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIModel',
      default: null,
    },
    isDetecting: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    fps: {
      type: Number,
      default: 0,
    },
    lastDetectionAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    thumbnailPath: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Camera', cameraSchema);
