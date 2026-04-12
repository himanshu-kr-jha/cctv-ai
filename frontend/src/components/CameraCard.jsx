import { Play, Square, Trash2, Video, Wifi, WifiOff, Clock, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { timeAgo } from '../utils/helpers';
import { useDashboardStore } from '../store/dashboardStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

export default function CameraCard({ camera, models, onAssignModel, onStart, onStop, onDelete, delay = 0 }) {
  const cameraStatus = useDashboardStore((s) => s.cameraStatuses[camera._id]);
  const canvasRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  useEffect(() => {
    let interval;
    if (camera.sourceType === 'webcam' && (camera.isDetecting || cameraStatus?.status === 'started')) {
      interval = setInterval(() => {
        setRefreshKey(Date.now());
      }, 500); // Poll at 2fps for UI fluidity without destroying bandwidth
    }
    return () => clearInterval(interval);
  }, [camera.sourceType, camera.isDetecting, cameraStatus?.status]);

  useEffect(() => {
    if (!canvasRef.current || !videoContainerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Auto-resize canvas to match its container exactly
    const container = videoContainerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!cameraStatus?.boundingBoxes || cameraStatus.boundingBoxes.length === 0) return;

    const frameWidth = cameraStatus.frameWidth || 640;
    const frameHeight = cameraStatus.frameHeight || 480;

    const scaleX = canvas.width / frameWidth;
    const scaleY = canvas.height / frameHeight;

    cameraStatus.boundingBoxes.forEach((box) => {
      // For general single-label model logic, if alertLabels is empty, everything is an alert.
      // If alertLabels has items, it's an alert only if it matches.
      let isAlert = true;
      if (cameraStatus.alertLabels && cameraStatus.alertLabels.length > 0) {
        isAlert = cameraStatus.alertLabels.map(l => l.toLowerCase()).includes(box.label.toLowerCase());
      }
      
      const x = box.x * scaleX;
      const y = box.y * scaleY;
      const w = box.w * scaleX;
      const h = box.h * scaleY;

      ctx.strokeStyle = isAlert ? '#ef4444' : '#10b981'; // red for alert, emerald for normal
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = isAlert ? '#ef4444' : '#10b981';
      const text = `${box.label.toUpperCase()} ${(box.confidence * 100).toFixed(0)}%${isAlert ? ' - ALERT' : ''}`;
      ctx.font = 'bold 10px sans-serif';
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x, y - 16, textWidth + 8, 16); // draw above box

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x + 4, y - 4);
    });
  }, [cameraStatus?.boundingBoxes, cameraStatus?.alertLabels, cameraStatus?.frameWidth, cameraStatus?.frameHeight]);
  const token = useAuthStore((s) => s.token);
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const status = cameraStatus?.status || (camera.isDetection || camera.isDetecting ? 'running' : 'idle');
  const fps = cameraStatus?.fps || camera.fps || 0;

  const statusConfig = {
    running: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Detecting' },
    started: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Started' },
    detected: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Object Found' },
    scanning: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Scanning' },
    stopped: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Stopped' },
    idle: { color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Idle' },
    error: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Error' },
  };

  const sts = statusConfig[status] || statusConfig.idle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.08 }}
      className="glass-card relative overflow-hidden"
    >
      {/* Video preview area */}
      <div 
        ref={videoContainerRef}
        className="relative w-full aspect-video bg-black/40 rounded-xl mb-4 overflow-hidden flex items-center justify-center"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
        
        {(camera.sourceType === 'file' || camera.sourceType === 'sample') ? (
          <video
            src={`${API_URL}/cameras/${camera._id}/stream?token=${token}`}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            crossOrigin="anonymous"
          />
        ) : camera.sourceType === 'webcam' && (camera.isDetecting || cameraStatus?.status === 'started') ? (
          <img
            src={`/uploads/snapshots/live_${camera._id}.jpg?t=${refreshKey}`}
            className="w-full h-full object-cover"
            alt="Webcam stream"
            onError={(e) => { e.target.style.opacity = '0'; }}
            onLoad={(e) => { e.target.style.opacity = '1'; }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-800/90 to-surface-900/90 flex flex-col items-center justify-center">
            <Video className="w-8 h-8 text-gray-700 mb-2" />
            <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">{camera.sourceType} Feed</span>
          </div>
        )}

        {/* Status overlay */}
        {camera.isDetecting && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">LIVE</span>
          </div>
        )}

        {/* FPS badge */}
        {fps > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-green-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
            {fps} FPS
          </div>
        )}

        {/* Online status */}
        <div className="absolute bottom-2 left-2">
          {camera.isOnline ? (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Wifi className="w-3 h-3" /> Online
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-red-400">
              <WifiOff className="w-3 h-3" /> Offline
            </div>
          )}
        </div>
      </div>

      {/* Camera Info */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-sm">{camera.name}</h3>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{camera.sourceType}</span>
        </div>
        <span className={`${sts.bg} ${sts.color} text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider`}>
          {sts.label}
        </span>
      </div>

      {/* Model assignment */}
      <div className="mb-3">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Assigned Model</label>
        <select
          value={camera.assignedModel?._id || ''}
          onChange={(e) => onAssignModel(camera._id, e.target.value)}
          className="select-field text-xs py-2"
        >
          <option value="">— None —</option>
          {models.map((m) => (
            <option key={m._id} value={m._id} disabled={!m.isActive}>
              {m.name} {!m.isActive ? '(inactive)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        {camera.lastDetectionAt && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(camera.lastDetectionAt)}</span>
          </div>
        )}
        {cameraStatus?.inferenceTimeMs && (
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span>{cameraStatus.inferenceTimeMs}ms</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        {!camera.isDetecting ? (
          <button
            onClick={() => onStart(camera._id)}
            disabled={!camera.assignedModel}
            className="btn-success flex-1 flex items-center justify-center gap-2 text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" /> Start
          </button>
        ) : (
          <button
            onClick={() => onStop(camera._id)}
            className="btn-danger flex-1 flex items-center justify-center gap-2 text-xs py-2"
          >
            <Square className="w-3.5 h-3.5" /> Stop
          </button>
        )}
        <button
          onClick={() => onDelete(camera._id)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
