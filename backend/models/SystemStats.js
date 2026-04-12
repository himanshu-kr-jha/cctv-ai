const mongoose = require('mongoose');

const systemStatsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalDetections: {
      type: Number,
      default: 0,
    },
    totalAlerts: {
      type: Number,
      default: 0,
    },
    activeCameras: {
      type: Number,
      default: 0,
    },
    activeModels: {
      type: Number,
      default: 0,
    },
    avgInferenceTime: {
      type: Number,
      default: 0,
    },
    detectionsByHour: {
      type: [Number],
      default: () => new Array(24).fill(0),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemStats', systemStatsSchema);
