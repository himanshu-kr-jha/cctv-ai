import { formatDate, confidencePercent, getSeverityClass } from '../utils/helpers';
import { Eye } from 'lucide-react';

export default function AlertRow({ alert, onPreview }) {
  return (
    <div className={`glass-card-sm flex items-center gap-4 animate-slide-in ${!alert.isRead ? 'border-l-2 border-l-primary-500' : ''}`}>
      {/* Snapshot thumbnail */}
      {alert.snapshotPath ? (
        <button
          onClick={() => onPreview(alert)}
          className="w-16 h-12 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 hover:ring-2 ring-primary-500/50 transition-all"
        >
          <img
            src={`/${alert.snapshotPath}`}
            alt="Detection"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </button>
      ) : (
        <div className="w-16 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-gray-600" />
        </div>
      )}

      {/* Alert info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-red-400">
            Alert: YES <span className="text-gray-300 font-normal">({alert.detectedLabel.toUpperCase()} Detected)</span>
          </span>
          <span className={getSeverityClass(alert.severity)}>
            {alert.severity}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{alert.camera?.name || 'Unknown'}</span>
          <span>•</span>
          <span>{alert.model?.name || 'Unknown'}</span>
          <span>•</span>
          <span>{confidencePercent(alert.confidence)}</span>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-400">{formatDate(alert.createdAt)}</p>
      </div>

      {/* Preview button */}
      <button
        onClick={() => onPreview(alert)}
        className="p-2 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all flex-shrink-0"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
}
