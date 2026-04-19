import { X } from 'lucide-react';
import { formatDate, confidencePercent, getSeverityClass } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImagePreviewModal({ alert, onClose }) {
  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800">Detection Snapshot</h3>
              <span className={getSeverityClass(alert.severity)}>{alert.severity}</span>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image */}
          <div className="p-4">
            {alert.snapshotPath ? (
              <img
                src={`/${alert.snapshotPath}`}
                alt={`Detection: ${alert.detectedLabel}`}
                className="w-full rounded-xl object-contain max-h-[60vh] bg-gray-100"
                onError={(e) => { e.target.src = ''; e.target.alt = 'Image unavailable'; }}
              />
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-400">No snapshot available</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-t border-gray-200">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Label</p>
              <p className="text-sm font-semibold text-gray-800">{alert.detectedLabel}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Confidence</p>
              <p className="text-sm font-semibold text-accent">{confidencePercent(alert.confidence)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Camera</p>
              <p className="text-sm font-medium text-gray-700">{alert.camera?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Timestamp</p>
              <p className="text-sm font-medium text-gray-700">{formatDate(alert.createdAt)}</p>
            </div>
          </div>

          {/* Bounding boxes info */}
          {alert.boundingBoxes && alert.boundingBoxes.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Detections ({alert.boundingBoxes.length})</p>
              <div className="flex flex-wrap gap-2">
                {alert.boundingBoxes.map((box, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200">
                    {box.label} — {(box.confidence * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
