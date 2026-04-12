const Camera = require('../models/Camera');
const AIModel = require('../models/AIModel');
const Alert = require('../models/Alert');
const DetectionLog = require('../models/DetectionLog');
const { asyncHandler } = require('../utils/helpers');

// GET /api/stats/dashboard
exports.dashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalCameras,
    activeCameras,
    totalModels,
    activeModels,
    alertsToday,
    totalAlerts,
    recentDetections,
    avgInference,
  ] = await Promise.all([
    Camera.countDocuments(),
    Camera.countDocuments({ isDetecting: true }),
    AIModel.countDocuments(),
    AIModel.countDocuments({ isActive: true }),
    Alert.countDocuments({ createdAt: { $gte: today } }),
    Alert.countDocuments(),
    DetectionLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('camera', 'name')
      .populate('model', 'name')
      .lean(),
    DetectionLog.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, avg: { $avg: '$inferenceTimeMs' } } },
    ]),
  ]);

  res.json({
    totalCameras,
    activeCameras,
    totalModels,
    activeModels,
    alertsToday,
    totalAlerts,
    recentDetections,
    avgInferenceTime: avgInference[0]?.avg?.toFixed(1) || 0,
  });
});

// GET /api/stats/analytics
exports.analytics = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const [detectionsByDay, alertsByDay, topLabels] = await Promise.all([
    DetectionLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          detections: { $sum: '$objectsDetected' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Alert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$detectedLabel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({ detectionsByDay, alertsByDay, topLabels });
});
