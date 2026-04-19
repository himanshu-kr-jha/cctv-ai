import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import AlertRow from '../components/AlertRow';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { SeverityPieChart, LabelBarChart } from '../components/ChartWidgets';
import { useAlertStore } from '../store/alertStore';
import { AlertTriangle, Download, Trash2, Search, Filter, BarChart3, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Alerts() {
  const queryClient = useQueryClient();
  const liveAlerts = useAlertStore((s) => s.liveAlerts);
  const [previewAlert, setPreviewAlert] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filters, setFilters] = useState({
    camera: '',
    label: '',
    severity: '',
    search: '',
    page: 1,
  });

  const { data: alertData, isLoading } = useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.camera) params.set('camera', filters.camera);
      if (filters.label) params.set('label', filters.label);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.search) params.set('search', filters.search);
      params.set('page', filters.page);
      params.set('limit', '30');
      return api.get(`/alerts?${params.toString()}`).then((r) => r.data);
    },
    refetchInterval: 15000,
  });

  const { data: alertStats } = useQuery({
    queryKey: ['alert-stats'],
    queryFn: () => api.get('/alerts/stats').then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: cameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.get('/cameras').then((r) => r.data),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.delete('/alerts'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      toast.success('Alerts cleared');
    },
  });

  const handleExport = async () => {
    try {
      const response = await api.get('/alerts/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `alerts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  // Merge live alerts on top of paginated results
  const displayAlerts = filters.page === 1 && !filters.camera && !filters.label && !filters.search
    ? [...liveAlerts.filter((la) => !alertData?.alerts?.find((a) => a._id === la._id)), ...(alertData?.alerts || [])]
    : alertData?.alerts || [];

  // Prepare stats chart data
  const severityData = alertStats?.bySeverity?.map((s) => ({
    name: s._id,
    count: s.count,
  })) || [];

  const labelChartData = alertStats?.byLabel?.slice(0, 6).map((l) => ({
    name: l._id,
    count: l.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Alerts
            {alertStats?.totalToday > 0 && (
              <span className="bg-red-100 text-red-600 text-sm px-3 py-0.5 rounded-full font-semibold">
                {alertStats.totalToday} today
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time detection alerts and history</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowStats(!showStats)} className="btn-secondary text-xs flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> {showStats ? 'Hide' : 'Stats'}
          </button>
          <button onClick={handleExport} className="btn-secondary text-xs flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={() => clearMutation.mutate()} className="btn-danger text-xs flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        </div>
      </div>

      {/* Stats charts */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
        >
          <div className="glass-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Severity Distribution</h3>
            {severityData.length > 0 ? (
              <>
                <SeverityPieChart data={severityData} />
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {severityData.map((s) => (
                    <span key={s.name} className={`badge-${s.name} text-[10px]`}>{s.name}: {s.count}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No data</p>
            )}
          </div>
          <div className="glass-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Labels</h3>
            {labelChartData.length > 0 ? (
              <LabelBarChart data={labelChartData} />
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No data</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="glass-card-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search alerts..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="input-field text-sm pl-10 py-2"
          />
        </div>
        <select
          value={filters.camera}
          onChange={(e) => setFilters({ ...filters, camera: e.target.value, page: 1 })}
          className="select-field text-sm py-2 w-full sm:w-44"
        >
          <option value="">All Cameras</option>
          {cameras?.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
          className="select-field text-sm py-2 w-full sm:w-36"
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          placeholder="Filter label..."
          value={filters.label}
          onChange={(e) => setFilters({ ...filters, label: e.target.value, page: 1 })}
          className="input-field text-sm py-2 w-full sm:w-36"
        />
      </div>

      {/* Alert list */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : displayAlerts.length > 0 ? (
        <div className="space-y-2">
          {displayAlerts.map((alert, i) => (
            <AlertRow
              key={alert._id || i}
              alert={alert}
              onPreview={(a) => setPreviewAlert(a)}
            />
          ))}

          {/* Pagination */}
          {alertData?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page <= 1}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {filters.page} of {alertData.totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= alertData.totalPages}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-16 px-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No alerts found</h3>
          <p className="text-gray-500 text-sm">Start detection on cameras to generate alerts</p>
        </motion.div>
      )}

      {/* Image preview modal */}
      <ImagePreviewModal alert={previewAlert} onClose={() => setPreviewAlert(null)} />
    </div>
  );
}
