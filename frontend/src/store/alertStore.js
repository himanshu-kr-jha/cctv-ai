import { create } from 'zustand';

export const useAlertStore = create((set, get) => ({
  liveAlerts: [],
  unreadCount: 0,

  addAlert: (alert) => {
    set((state) => ({
      liveAlerts: [alert, ...state.liveAlerts].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllRead: () => set({ unreadCount: 0 }),

  clearLiveAlerts: () => set({ liveAlerts: [], unreadCount: 0 }),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));
