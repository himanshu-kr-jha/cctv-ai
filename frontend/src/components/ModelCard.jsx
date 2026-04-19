import { Box, Trash2, ToggleLeft, ToggleRight, Cpu } from 'lucide-react';
import { formatFileSize, timeAgo } from '../utils/helpers';
import { motion } from 'framer-motion';

export default function ModelCard({ model, onToggle, onDelete, delay = 0 }) {
  const typeColors = {
    yolo: 'from-violet-50 to-purple-50 border-violet-200',
    onnx: 'from-blue-50 to-cyan-50 border-blue-200',
    tensorflow: 'from-orange-50 to-yellow-50 border-orange-200',
    pytorch: 'from-red-50 to-pink-50 border-red-200',
    custom: 'from-gray-50 to-slate-50 border-gray-200',
  };

  const typeBadgeColors = {
    yolo: 'bg-violet-100 text-violet-600',
    onnx: 'bg-blue-100 text-blue-600',
    tensorflow: 'bg-orange-100 text-orange-600',
    pytorch: 'bg-red-100 text-red-600',
    custom: 'bg-gray-100 text-gray-600',
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
          <div className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100">
            <Cpu className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{model.name}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${typeBadgeColors[model.modelType] || typeBadgeColors.custom}`}>
              {model.modelType}
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggle(model._id)}
          className={`p-1.5 rounded-lg transition-colors ${model.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
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
            <span key={label} className={`text-[10px] px-2 py-0.5 rounded-md ${isAlert ? 'bg-red-100 text-red-600 font-medium border border-red-200' : 'bg-gray-100 text-gray-600'}`}>
              {label}
            </span>
          );
        })}
        {model.labels.length > 6 && (
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">+{model.labels.length - 6} more</span>
        )}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
        <div>
          <span className="text-gray-400">Threshold</span>
          <p className="text-gray-700 font-medium">{(model.confidenceThreshold * 100).toFixed(0)}%</p>
        </div>
        <div>
          <span className="text-gray-400">Resolution</span>
          <p className="text-gray-700 font-medium">{model.inputResolution}px</p>
        </div>
        <div>
          <span className="text-gray-400">Size</span>
          <p className="text-gray-700 font-medium">{formatFileSize(model.fileSize)}</p>
        </div>
        <div>
          <span className="text-gray-400">Uploaded</span>
          <p className="text-gray-700 font-medium">{timeAgo(model.createdAt)}</p>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className={model.isActive ? 'badge-active' : 'badge-inactive'}>
          {model.isActive ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={() => onDelete(model._id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Delete model"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
