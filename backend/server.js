require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./config/db');
const { createServer } = require('http');
const { initSocket } = require('./config/socket');
const { errorHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const modelRoutes = require('./routes/modelRoutes');
const cameraRoutes = require('./routes/cameraRoutes');
const alertRoutes = require('./routes/alertRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Import scheduler
const { startScheduler } = require('./workers/schedulerWorker');

const app = express();
const httpServer = createServer(app);

// Init Socket.IO
const io = initSocket(httpServer);
app.set('io', io);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files (snapshots, uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/streams', express.static(path.join(__dirname, 'streams')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
  
  // Start the detection scheduler
  startScheduler();

  // Restore running webcam streams
  const { startWebcamStream } = require('./services/webcamService');
  const Camera = require('./models/Camera');
  const activeWebcams = await Camera.find({ isDetecting: true, sourceType: 'webcam' });
  for (const cam of activeWebcams) {
    startWebcamStream(cam._id, cam.sourceUrl);
  }
};

start().catch(console.error);

module.exports = { app, httpServer };
