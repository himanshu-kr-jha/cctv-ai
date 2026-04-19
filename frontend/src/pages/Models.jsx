import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import ModelCard from '../components/ModelCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Upload, X, Box, Cpu, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MODEL_TYPES } from '../utils/constants';

export default function Models() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    labels: '',
    alertLabels: '',
    confidenceThreshold: '0.5',
    inputResolution: '640',
    modelType: 'onnx',
    description: '',
    file: null,
  });

  const { data: models, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => api.get('/models').then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/models', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setShowForm(false);
      resetForm();
      toast.success('Model uploaded successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/models/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setDeleteId(null);
      toast.success('Model deleted');
    },
  });

  const resetForm = () => {
    setForm({ name: '', labels: '', alertLabels: '', confidenceThreshold: '0.5', inputResolution: '640', modelType: 'onnx', description: '', file: null });
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!form.file) {
      toast.error('Please select a model file');
      return;
    }
    const fd = new FormData();
    fd.append('modelFile', form.file);
    fd.append('name', form.name);
    fd.append('labels', JSON.stringify(form.labels.split(',').map((l) => l.trim()).filter(Boolean)));
    fd.append('alertLabels', JSON.stringify(form.alertLabels.split(',').map((l) => l.trim()).filter(Boolean)));
    fd.append('confidenceThreshold', form.confidenceThreshold);
    fd.append('inputResolution', form.inputResolution);
    fd.append('modelType', form.modelType);
    fd.append('description', form.description);
    uploadMutation.mutate(fd);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Models</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage detection models</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Upload Model'}
        </button>
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleUpload} className="glass-card space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="w-4 h-4 text-accent" /> Upload New Model
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Model Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g., YOLOv8 Small"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Model Type</label>
                  <select
                    value={form.modelType}
                    onChange={(e) => setForm({ ...form, modelType: e.target.value })}
                    className="select-field text-sm"
                  >
                    {MODEL_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Labels (comma-separated)</label>
                  <input
                    value={form.labels}
                    onChange={(e) => setForm({ ...form, labels: e.target.value })}
                    className="input-field text-sm"
                    placeholder="person, car, truck, bicycle"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Alert Labels (comma-separated)</label>
                  <input
                    value={form.alertLabels}
                    onChange={(e) => setForm({ ...form, alertLabels: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g., drowsy, fire, weapon"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Threshold</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1"
                      value={form.confidenceThreshold}
                      onChange={(e) => setForm({ ...form, confidenceThreshold: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Resolution</label>
                    <input
                      type="number"
                      value={form.inputResolution}
                      onChange={(e) => setForm({ ...form, inputResolution: e.target.value })}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Brief description of the model"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Model File</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-accent/50 transition-colors cursor-pointer bg-gray-50"
                    onClick={() => document.getElementById('model-file-input').click()}>
                    {form.file ? (
                      <p className="text-sm text-accent font-medium">{form.file.name} ({(form.file.size / 1024 / 1024).toFixed(1)} MB)</p>
                    ) : (
                      <p className="text-sm text-gray-400">Click or drag to upload .onnx, .pt, .pb, .tflite, .h5</p>
                    )}
                    <input
                      id="model-file-input"
                      type="file"
                      accept=".onnx,.pt,.pth,.pb,.tflite,.h5,.bin"
                      className="hidden"
                      onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={uploadMutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
                  {uploadMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Model
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Models grid */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : models?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {models.map((model, i) => (
            <ModelCard
              key={model._id}
              model={model}
              onToggle={(id) => toggleMutation.mutate(id)}
              onDelete={(id) => setDeleteId(id)}
              delay={i}
            />
          ))}
        </div>
      ) : (
        /* ── Empty state: all models removed ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-16 px-8"
        >
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <Cpu className="w-10 h-10 text-accent" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No AI models uploaded yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Upload your first detection model to start monitoring camera feeds. Supports YOLO, ONNX, TensorFlow, and PyTorch formats.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Your First Model
          </button>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {MODEL_TYPES.slice(0, 4).map((type) => (
              <div key={type.value} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <Box className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{type.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Model"
        message="Are you sure you want to delete this model? This action cannot be undone and the model file will be removed."
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
