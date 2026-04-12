import { Box, Trash2, ToggleLeft, ToggleRight, Cpu } from 'lucide-react';
import { formatFileSize, timeAgo } from '../utils/helpers';
import { motion } from 'framer-motion';

export default function ModelCard({ model, onToggle, onDelete, delay = 0 }) {
  const typeColors = {
    yolo: 'from-violet-500/30 to-purple-500/20 border-violet-500/30',
    onnx: 'from-blue-500/30 to-cyan-500/20 border-blue-500/30',
    tensorflow: 'from-orange-500/30 to-yellow-500/20 border-orange-500/30',
    pytorch: 'from-red-500/30 to-pink-500/20 border-red-500/30',
    custom: 'from-gray-500/30 to-slate-500/20 border-gray-500/30',
  };

  const typeBadgeColors = {
    yolo: 'bg-violet-500/20 text-violet-400',
    onnx: 'bg-blue-500/20 text-blue-400',
    tensorflow: 'bg-orange-500/20 text-orange-400',
    pytorch: 'bg-red-500/20 text-red-400',
    custom: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.08 }}
      className={`glass-card bg-gradient-to-br ${typeColors[model.modelType] || typeColors.custom} relative overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5">
            <Cpu className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{model.name}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${typeBadgeColors[model.modelType] || typeBadgeColors.custom}`}>
              {model.modelType}
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggle(model._id)}
          className={`p-1.5 rounded-lg transition-colors ${model.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-500 hover:bg-white/5'}`}
          title={model.isActive ? 'Deactivate' : 'Activate'}
        >
          {model.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-1 mb-3 max-h-16 overflow-hidden">
        {model.labels.slice(0, 6).map((label) => {
          const isAlert = model.alertLabels?.includes(label);
          return (
            <span key={label} className={`text-[10px] px-2 py-0.5 rounded-md ${isAlert ? 'bg-red-500/20 text-red-400 font-medium border border-red-500/30' : 'bg-white/5 text-gray-400'}`}>
              {label}
            </span>
          );
        })}
        {model.labels.length > 6 && (
          <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-md">+{model.labels.length - 6} more</span>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
        <div>
          <span className="text-gray-600">Threshold</span>
          <p className="text-gray-300 font-medium">{(model.confidenceThreshold * 100).toFixed(0)}%</p>
        </div>
        <div>
          <span className="text-gray-600">Resolution</span>
          <p className="text-gray-300 font-medium">{model.inputResolution}px</p>
        </div>
        <div>
          <span className="text-gray-600">Size</span>
          <p className="text-gray-300 font-medium">{formatFileSize(model.fileSize)}</p>
        </div>
        <div>
          <span className="text-gray-600">Uploaded</span>
          <p className="text-gray-300 font-medium">{timeAgo(model.createdAt)}</p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className={model.isActive ? 'badge-active' : 'badge-inactive'}>
          {model.isActive ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={() => onDelete(model._id)}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          title="Delete model"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
