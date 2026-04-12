import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAlertStore } from '../store/alertStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function useSocket() {
  const socketRef = useRef(null);
  const addAlert = useAlertStore((s) => s.addAlert);
  const updateCameraStatus = useDashboardStore((s) => s.updateCameraStatus);
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    if (!s.connected) {
      s.connect();
    }

    s.emit('join-dashboard');

    s.on('new-alert', (alert) => {
      addAlert(alert);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    s.on('detection-status', (data) => {
      updateCameraStatus(data.cameraId, data);
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    });

    s.on('camera-status', (data) => {
      updateCameraStatus(data.cameraId, data);
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    });

    s.on('model-assigned', () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
    });

    s.on('stats-update', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    });

    return () => {
      s.off('new-alert');
      s.off('detection-status');
      s.off('camera-status');
      s.off('model-assigned');
      s.off('stats-update');
    };
  }, [addAlert, updateCameraStatus, queryClient]);

  return socketRef.current;
}
