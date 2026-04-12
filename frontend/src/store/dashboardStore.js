import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  sidebarOpen: true,
  darkMode: true,
  cameraStatuses: {},

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

  updateCameraStatus: (cameraId, status) =>
    set((s) => ({
      cameraStatuses: { ...s.cameraStatuses, [cameraId]: status },
    })),
}));
