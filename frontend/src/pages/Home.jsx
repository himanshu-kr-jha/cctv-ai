import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { StatsSkeleton } from '../components/LoadingSkeleton';
import { DetectionAreaChart, LabelBarChart } from '../components/ChartWidgets';
import {
  Camera, Box, AlertTriangle, Zap, Activity, Shield, Clock,
  Eye, Cpu, Wifi, MonitorPlay, BrainCircuit, Radio, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { timeAgo } from '../utils/helpers';

export default function Home() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/stats/dashboard').then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/stats/analytics?days=7').then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <StatsSkeleton />;

  // Prepare chart data
  const chartData = analytics?.detectionsByDay?.map((d, i) => ({
    date: d._id?.slice(5) || `Day ${i + 1}`,
    detections: d.detections || d.count || 0,
    alerts: analytics.alertsByDay?.find((a) => a._id === d._id)?.count || 0,
  })) || [];

  const labelData = analytics?.topLabels?.map((l) => ({
    name: l._id,
    count: l.count,
  })) || [];

  const features = [
    { icon: BrainCircuit, title: 'AI Model Management', desc: 'Upload YOLO, ONNX, TensorFlow, or PyTorch models with configurable thresholds and alert labels.' },
    { icon: MonitorPlay, title: 'Multi-Camera Streams', desc: 'Support for webcam, RTSP, file, and sample feeds with live video preview and bounding box overlay.' },
    { icon: Radio, title: 'Real-time Detection', desc: 'Automated inference every 5 seconds with BullMQ job queues and Socket.IO live push notifications.' },
    { icon: Layers, title: 'Smart Alert Logic', desc: 'Configurable alert labels per model — only trigger alerts on critical detections like "Drowsy" or "Fire".' },
  ];

  return (
    <div className="space-y-8">
      {/* ── Hero / About Section ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
      >
        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-surface-800/90 to-purple-600/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/8 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Left — Branding */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-xl shadow-primary-600/25 animate-float">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">SentinelAI</h1>
                  <p className="text-xs text-primary-400/80 tracking-widest uppercase font-semibold">Intelligent Surveillance Platform</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                A production-grade AI surveillance system that monitors multiple camera feeds using uploaded deep learning models,
                performs automated object detection every 5 seconds, and stores annotated alert snapshots with bounding boxes.
                Built with ONNX Runtime, Express, Socket.IO, and React.
              </p>
              <div className="flex flex-wrap gap-2">
                {['ONNX Runtime', 'Socket.IO', 'BullMQ', 'React', 'MongoDB'].map((t) => (
                  <span key={t} className="text-[10px] font-medium text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg uppercase tracking-wider">{t}</span>
                ))}
              </div>
            </div>

            {/* Right — Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group"
                >
                  <f.icon className="w-5 h-5 text-primary-400 mb-2 group-hover:text-primary-300 transition-colors" />
                  <h4 className="text-xs font-semibold text-gray-200 mb-1">{f.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Camera}
          title="Active Cameras"
          value={stats?.activeCameras || 0}
          subtitle={`${stats?.totalCameras || 0} total cameras`}
          color="blue"
          delay={0}
        />
        <StatCard
          icon={Box}
          title="AI Models"
          value={stats?.activeModels || 0}
          subtitle={`${stats?.totalModels || 0} total models`}
          color="primary"
          delay={1}
        />
        <StatCard
          icon={AlertTriangle}
          title="Alerts Today"
          value={stats?.alertsToday || 0}
          subtitle={`${stats?.totalAlerts || 0} all time`}
          color="red"
          delay={2}
        />
        <StatCard
          icon={Zap}
          title="Avg Inference"
          value={`${stats?.avgInferenceTime || 0}ms`}
          subtitle="Average processing time"
          color="yellow"
          delay={3}
        />
      </div>

      {/* ── Charts ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card lg:col-span-2"
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" />
            Detection Activity (7 days)
          </h3>
          {chartData.length > 0 ? (
            <DetectionAreaChart data={chartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-600 text-sm">
              No detection data yet. Start cameras to see analytics.
            </div>
          )}
        </motion.div>

        {/* Label distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Detected Labels</h3>
          {labelData.length > 0 ? (
            <LabelBarChart data={labelData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              No label data available
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Recent detections ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-400" />
          Recent Detections
        </h3>
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {stats?.recentDetections?.length > 0 ? (
            stats.recentDetections.map((det, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${det.objectsDetected > 0 ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                  <div>
                    <p className="text-sm text-gray-300 font-medium">{det.camera?.name || 'Camera'}</p>
                    <p className="text-xs text-gray-600">{det.labels?.join(', ') || 'No objects'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-400">{det.objectsDetected} objects</p>
                  <p className="text-[10px] text-gray-600">{timeAgo(det.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm text-center py-8">No detections yet</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
