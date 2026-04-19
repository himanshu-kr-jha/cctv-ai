import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import CameraCard from '../components/CameraCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, X, Camera as CameraIcon, Video, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { SOURCE_TYPES } from '../utils/constants';

export default function Cameras() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', sourceType: 'sample', sourceUrl: '' });

  const { data: cameras, isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => api.get('/cameras').then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => api.get('/models').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/cameras', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setShowForm(false);
      setForm({ name: '', sourceType: 'sample', sourceUrl: '' });
      toast.success('Camera added');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add camera'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ cameraId, modelId }) => api.patch(`/cameras/${cameraId}/model`, { modelId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast.success('Model assigned');
    },
  });

  const startMutation = useMutation({
    mutationFn: (id) => api.post(`/cameras/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast.success('Detection started');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start'),
  });

  const stopMutation = useMutation({
    mutationFn: (id) => api.post(`/cameras/${id}/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast.success('Detection stopped');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/cameras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setDeleteId(null);
      toast.success('Camera deleted');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Camera name is required');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cameras</h1>
          <p className="text-gray-500 text-sm mt-1">Manage video feeds and detection</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Camera'}
        </button>
      </div>

      {/* Add camera form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="glass-card space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CameraIcon className="w-4 h-4 text-accent" /> Add New Camera
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Camera Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g., Front Gate"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Source Type</label>
                  <select
                    value={form.sourceType}
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
                    className="select-field text-sm"
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {form.sourceType === 'rtsp' ? 'RTSP URL' : form.sourceType === 'file' ? 'File Path' : 'Source (Optional)'}
                  </label>
                  <input
                    value={form.sourceUrl}
                    onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                    className="input-field text-sm"
                    placeholder={form.sourceType === 'rtsp' ? 'rtsp://...' : 'Leave empty for sample'}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" /> Add Camera
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cameras grid */}
      {isLoading ? (
        <CardSkeleton count={3} />
      ) : cameras?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera, i) => (
            <CameraCard
              key={camera._id}
              camera={camera}
              models={models || []}
              onAssignModel={(cId, mId) => assignMutation.mutate({ cameraId: cId, modelId: mId || null })}
              onStart={(id) => startMutation.mutate(id)}
              onStop={(id) => stopMutation.mutate(id)}
              onDelete={(id) => setDeleteId(id)}
              delay={i}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-16 px-8"
        >
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <Video className="w-10 h-10 text-accent" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-accent" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No cameras configured</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Add your first camera to start monitoring video feeds. Supports webcam, RTSP streams, video files, and sample feeds.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Your First Camera
          </button>
        </motion.div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Camera"
        message="Are you sure you want to delete this camera? Active detection will be stopped."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
