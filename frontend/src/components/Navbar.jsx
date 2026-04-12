import { Bell, Menu, LogOut, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const unreadCount = useAlertStore((s) => s.unreadCount);
  const markAllRead = useAlertStore((s) => s.markAllRead);
  const toggleSidebar = useDashboardStore((s) => s.toggleSidebar);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-surface-800/70 backdrop-blur-2xl border-b border-white/[0.04]">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/[0.06] transition-all">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Alert bell */}
        <button
          onClick={() => { markAllRead(); navigate('/alerts'); }}
          className="relative p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full alert-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.06] mx-1.5" />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-white/[0.06] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary-600/15">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-200 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">{user?.role}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 glass rounded-xl py-1.5 animate-fade-in shadow-2xl">
              <div className="px-4 py-2.5 border-b border-white/[0.04]">
                <p className="text-sm font-medium text-gray-200">{user?.name}</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
