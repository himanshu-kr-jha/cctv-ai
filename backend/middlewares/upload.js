const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Model upload storage
const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'models'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `model_${uuidv4()}${ext}`);
  },
});

const modelFileFilter = (req, file, cb) => {
  const allowed = ['.onnx', '.pb', '.pt', '.pth', '.tflite', '.h5', '.bin'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid model file type: ${ext}. Allowed: ${allowed.join(', ')}`), false);
  }
};

const uploadModel = multer({
  storage: modelStorage,
  fileFilter: modelFileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// Snapshot upload storage
const snapshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'snapshots'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `snap_${uuidv4()}${ext}`);
  },
});

const uploadSnapshot = multer({
  storage: snapshotStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { uploadModel, uploadSnapshot };
