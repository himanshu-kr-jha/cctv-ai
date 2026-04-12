const Alert = require('../models/Alert');
const { asyncHandler } = require('../utils/helpers');

// GET /api/alerts
exports.listAlerts = asyncHandler(async (req, res) => {
  const { camera, label, severity, startDate, endDate, search, page = 1, limit = 30 } = req.query;

  const filter = {};
  if (camera) filter.camera = camera;
  if (label) filter.detectedLabel = { $regex: label, $options: 'i' };
  if (severity) filter.severity = severity;
  if (search) {
    filter.$or = [
      { detectedLabel: { $regex: search, $options: 'i' } },
    ];
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const total = await Alert.countDocuments(filter);
  const alerts = await Alert.find(filter)
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate('camera', 'name sourceType')
    .populate('model', 'name modelType');

  res.json({
    alerts,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

// GET /api/alerts/stats
exports.alertStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalToday, byLabel, bySeverity, byCamera, recent24h] = await Promise.all([
    Alert.countDocuments({ createdAt: { $gte: today } }),
    Alert.aggregate([
      { $group: { _id: '$detectedLabel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
    Alert.aggregate([
      {
        $lookup: { from: 'cameras', localField: 'camera', foreignField: '_id', as: 'cam' },
      },
      { $unwind: '$cam' },
      { $group: { _id: '$cam.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // Alerts per hour for last 24 hours
    Alert.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    totalToday,
    byLabel,
    bySeverity,
    byCamera,
    hourlyDistribution: recent24h,
  });
});

// GET /api/alerts/:id
exports.getAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id)
    .populate('camera', 'name sourceType')
    .populate('model', 'name modelType');
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json(alert);
});

// PATCH /api/alerts/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json(alert);
});

// DELETE /api/alerts
exports.clearAlerts = asyncHandler(async (req, res) => {
  const { camera, label, before } = req.query;
  const filter = {};
  if (camera) filter.camera = camera;
  if (label) filter.detectedLabel = label;
  if (before) filter.createdAt = { $lte: new Date(before) };

  const result = await Alert.deleteMany(filter);
  res.json({ message: `Deleted ${result.deletedCount} alerts` });
});

// GET /api/alerts/export/csv
exports.exportCSV = asyncHandler(async (req, res) => {
  const alerts = await Alert.find()
    .sort({ createdAt: -1 })
    .limit(5000)
    .populate('camera', 'name')
    .populate('model', 'name')
    .lean();

  const header = 'Timestamp,Camera,Model,Label,Confidence,Severity\n';
  const rows = alerts.map((a) =>
    `${a.createdAt.toISOString()},${a.camera?.name || 'N/A'},${a.model?.name || 'N/A'},${a.detectedLabel},${a.confidence.toFixed(3)},${a.severity}`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=alerts_export.csv');
  res.send(header + rows);
});
