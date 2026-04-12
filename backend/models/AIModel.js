const mongoose = require('mongoose');

const aiModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
      maxlength: 200,
    },
    labels: {
      type: [String],
      default: [],
    },
    alertLabels: {
      type: [String],
      default: [],
    },
    confidenceThreshold: {
      type: Number,
      default: 0.5,
      min: 0.1,
      max: 1.0,
    },
    inputResolution: {
      type: Number,
      default: 640,
    },
    filePath: {
      type: String,
      required: [true, 'Model file path is required'],
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    modelType: {
      type: String,
      enum: ['yolo', 'onnx', 'tensorflow', 'pytorch', 'custom'],
      default: 'onnx',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Virtual for upload date alias
aiModelSchema.virtual('uploadDate').get(function () {
  return this.createdAt;
});

aiModelSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AIModel', aiModelSchema);
