export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
};

export const MODEL_TYPES = [
  { value: 'yolo', label: 'YOLO' },
  { value: 'onnx', label: 'ONNX' },
  { value: 'tensorflow', label: 'TensorFlow' },
  { value: 'pytorch', label: 'PyTorch' },
  { value: 'custom', label: 'Custom' },
];

export const SOURCE_TYPES = [
  { value: 'sample', label: 'Sample Feed' },
  { value: 'webcam', label: 'Webcam' },
  { value: 'rtsp', label: 'RTSP Stream' },
  { value: 'file', label: 'Video File' },
];
