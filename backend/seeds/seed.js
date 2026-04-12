require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const AIModel = require('../models/AIModel');
const Camera = require('../models/Camera');
const Alert = require('../models/Alert');
const DetectionLog = require('../models/DetectionLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cctv_ai';

// Ensure upload directories exist
const dirs = [
  path.join(__dirname, '..', 'uploads', 'models'),
  path.join(__dirname, '..', 'uploads', 'snapshots'),
  path.join(__dirname, '..', 'streams', 'samples'),
];
dirs.forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Create placeholder model files for demo
function createDemoModelFile(filename) {
  const filePath = path.join(__dirname, '..', 'uploads', 'models', filename);
  if (!fs.existsSync(filePath)) {
    // Create a tiny placeholder file (not a real ONNX model — inference will use simulated results)
    fs.writeFileSync(filePath, Buffer.from('DEMO_MODEL_PLACEHOLDER'));
  }
  return filePath;
}

// Create sample video files (synthetic test pattern)
function createSampleVideo(filename) {
  const filePath = path.join(__dirname, '..', 'streams', 'samples', filename);
  if (!fs.existsSync(filePath)) {
    // Create a .gitkeep as placeholder
    fs.writeFileSync(filePath + '.placeholder', 'sample_video_placeholder');
  }
  return filename; // Return just the filename for sourceUrl (relative to samples dir)
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      AIModel.deleteMany({}),
      Camera.deleteMany({}),
      Alert.deleteMany({}),
      DetectionLog.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data\n');

    // 1. Create Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@cctv.ai',
      password: 'admin123',
      role: 'admin',
    });

    const operator = await User.create({
      name: 'Operator User',
      email: 'operator@cctv.ai',
      password: 'operator123',
      role: 'operator',
    });

    console.log('👤 Users created:');
    console.log('   admin@cctv.ai / admin123 (admin)');
    console.log('   operator@cctv.ai / operator123 (operator)\n');

    // 2. Create AI Models
    const model1Path = createDemoModelFile('yolov8n_demo.onnx');
    const model2Path = createDemoModelFile('person_detector_demo.onnx');

    const yoloModel = await AIModel.create({
      name: 'YOLOv8 Nano (Demo)',
      labels: [
        'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
        'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
        'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
        'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
        'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
        'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
        'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
        'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
        'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
        'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
        'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
        'hair drier', 'toothbrush',
      ],
      confidenceThreshold: 0.5,
      inputResolution: 640,
      filePath: model1Path,
      fileSize: 6400000,
      modelType: 'yolo',
      isActive: true,
      uploadedBy: admin._id,
      description: 'YOLOv8 Nano model for general object detection with 80 COCO classes. Demo mode uses simulated detections.',
    });

    const personModel = await AIModel.create({
      name: 'Person Detector (Demo)',
      labels: ['person'],
      confidenceThreshold: 0.6,
      inputResolution: 320,
      filePath: model2Path,
      fileSize: 2100000,
      modelType: 'onnx',
      isActive: true,
      uploadedBy: admin._id,
      description: 'Lightweight person detection model optimized for surveillance. Demo mode uses simulated detections.',
    });

    console.log('🤖 AI Models created:');
    console.log(`   ${yoloModel.name} (80 labels, threshold: 0.5)`);
    console.log(`   ${personModel.name} (1 label, threshold: 0.6)\n`);

    // 3. Create Sample Cameras
    const sampleVideo1 = createSampleVideo('entrance_feed.mp4');
    const sampleVideo2 = createSampleVideo('parking_feed.mp4');
    const sampleVideo3 = createSampleVideo('lobby_feed.mp4');

    const cam1 = await Camera.create({
      name: 'Main Entrance',
      sourceType: 'sample',
      sourceUrl: sampleVideo1,
      assignedModel: yoloModel._id,
      isOnline: true,
      createdBy: admin._id,
    });

    const cam2 = await Camera.create({
      name: 'Parking Lot - A',
      sourceType: 'sample',
      sourceUrl: sampleVideo2,
      assignedModel: yoloModel._id,
      isOnline: true,
      createdBy: admin._id,
    });

    const cam3 = await Camera.create({
      name: 'Lobby Camera',
      sourceType: 'sample',
      sourceUrl: sampleVideo3,
      assignedModel: personModel._id,
      isOnline: true,
      createdBy: operator._id,
    });

    console.log('📹 Cameras created:');
    console.log(`   ${cam1.name} → ${yoloModel.name}`);
    console.log(`   ${cam2.name} → ${yoloModel.name}`);
    console.log(`   ${cam3.name} → ${personModel.name}\n`);

    // 4. Create Demo Alerts
    const demoAlerts = [
      { camera: cam1._id, model: yoloModel._id, detectedLabel: 'person', confidence: 0.92, severity: 'critical' },
      { camera: cam1._id, model: yoloModel._id, detectedLabel: 'car', confidence: 0.85, severity: 'high' },
      { camera: cam2._id, model: yoloModel._id, detectedLabel: 'truck', confidence: 0.78, severity: 'high' },
      { camera: cam2._id, model: yoloModel._id, detectedLabel: 'person', confidence: 0.65, severity: 'medium' },
      { camera: cam3._id, model: personModel._id, detectedLabel: 'person', confidence: 0.95, severity: 'critical' },
      { camera: cam1._id, model: yoloModel._id, detectedLabel: 'bicycle', confidence: 0.72, severity: 'medium' },
      { camera: cam3._id, model: personModel._id, detectedLabel: 'person', confidence: 0.88, severity: 'high' },
      { camera: cam2._id, model: yoloModel._id, detectedLabel: 'car', confidence: 0.56, severity: 'medium' },
      { camera: cam1._id, model: yoloModel._id, detectedLabel: 'dog', confidence: 0.45, severity: 'low' },
      { camera: cam3._id, model: personModel._id, detectedLabel: 'person', confidence: 0.91, severity: 'critical' },
    ];

    // Spread alerts across the last 24 hours
    const now = Date.now();
    for (let i = 0; i < demoAlerts.length; i++) {
      demoAlerts[i].createdAt = new Date(now - (i * 2.4 * 60 * 60 * 1000)); // Every ~2.4 hours
      demoAlerts[i].boundingBoxes = [
        {
          x: Math.floor(Math.random() * 300) + 100,
          y: Math.floor(Math.random() * 200) + 50,
          w: Math.floor(Math.random() * 100) + 50,
          h: Math.floor(Math.random() * 120) + 60,
          label: demoAlerts[i].detectedLabel,
          confidence: demoAlerts[i].confidence,
        },
      ];
    }

    await Alert.insertMany(demoAlerts);
    console.log(`🚨 ${demoAlerts.length} demo alerts created\n`);

    // 5. Create demo detection logs
    const demoLogs = [];
    for (let i = 0; i < 50; i++) {
      const cameras = [cam1, cam2, cam3];
      const cam = cameras[i % 3];
      demoLogs.push({
        camera: cam._id,
        model: cam.assignedModel,
        objectsDetected: Math.floor(Math.random() * 5),
        inferenceTimeMs: Math.floor(Math.random() * 150) + 20,
        labels: ['person', 'car', 'truck'].slice(0, Math.floor(Math.random() * 3) + 1),
        createdAt: new Date(now - i * 30 * 60 * 1000), // Every 30 mins
      });
    }
    await DetectionLog.insertMany(demoLogs);
    console.log(`📊 ${demoLogs.length} detection logs created\n`);

    console.log('✅ Database seeded successfully!\n');
    console.log('─────────────────────────────────────');
    console.log('  Login with: admin@cctv.ai / admin123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
