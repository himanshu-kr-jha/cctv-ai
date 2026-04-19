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
  const ext = path.extname(file.originalname).toLowerCase();

  // Only ONNX models are supported by the inference engine
  if (ext === '.onnx') {
    return cb(null, true);
  }

  // Give a specific, helpful error for PyTorch files
  if (ext === '.pt' || ext === '.pth') {
    return cb(
      new Error(
        `PyTorch models (${ext}) are not directly supported. Please convert to ONNX first using: "yolo export model=your_model${ext} format=onnx"`
      ),
      false
    );
  }

  cb(
    new Error(
      `Unsupported model format: ${ext}. Only .onnx models are supported. Convert your model to ONNX format first.`
    ),
    false
  );
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
