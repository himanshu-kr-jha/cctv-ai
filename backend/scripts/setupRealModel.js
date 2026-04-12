const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config();

const AIModel = require('../models/AIModel');

async function downloadRealModel() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cctv_ai');
  console.log('✅ Connected to MongoDB');

  const MODEL_DIR = path.join(__dirname, '..', 'uploads', 'models');
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  const modelPath = path.join(MODEL_DIR, 'yolov8n.onnx');
  
  if (!fs.existsSync(modelPath)) {
    console.log('📥 Downloading real YOLOv8n ONNX model (this may take a minute)...');
    try {
      // Using a reliable source for standard YOLOv8n ONNX
      execSync(`curl -L -o "${modelPath}" "https://github.com/ibaiGorordo/ONNX-YOLOv8-Object-Detection/raw/main/models/yolov8n.onnx"`, { stdio: 'inherit' });
      console.log('✅ Model downloaded successfully');
    } catch (err) {
      console.error('❌ Failed to download model. Please download it manually from https://github.com/ibaiGorordo/ONNX-YOLOv8-Object-Detection/raw/main/models/yolov8n.onnx and place it in backend/uploads/models/');
      process.exit(1);
    }
  } else {
    console.log('✅ Real YOLOv8n model already exists in uploads directory');
  }

  // Common COCO Labels
  const cocoLabels = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
    'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
  ];

  console.log('📝 Registering real model in database...');
  
  // Replace the demo YOLOv8 model with this real one
  const existingModel = await AIModel.findOne({ name: 'YOLOv8 Nano (Demo)' });
  
  if (existingModel) {
    existingModel.name = 'YOLOv8 Nano (Real)';
    existingModel.filePath = modelPath; // Absolute path to real model
    existingModel.fileSize = fs.statSync(modelPath).size;
    existingModel.labels = cocoLabels;
    existingModel.modelType = 'onnx';
    await existingModel.save();
    console.log('✅ Updated existing demo model to use real ONNX weights');
  } else {
    await AIModel.create({
      name: 'YOLOv8 Nano (Real COCO)',
      modelType: 'onnx',
      description: 'Real YOLOv8 Nano model trained on COCO dataset',
      filePath: modelPath,
      fileSize: fs.statSync(modelPath).size,
      confidenceThreshold: 0.45,
      inputResolution: 640,
      labels: cocoLabels,
      isActive: true,
      createdBy: null
    });
    console.log('✅ Created new database entry for real model');
  }

  console.log('\n🎉 Setup complete! The backend inferenceService will now use the real ONNX Runtime instead of simulating detections.');
  console.log('   Go to the Cameras page and ensure models are assigned, then press Start.');
  
  await mongoose.disconnect();
}

downloadRealModel().catch(console.error);
