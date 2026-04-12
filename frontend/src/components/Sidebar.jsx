import { NavLink } from 'react-router-dom';
import { Home, Box, Camera, AlertTriangle, ChevronLeft, ChevronRight, Shield, Scan } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useAlertStore } from '../store/alertStore';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/models', icon: Box, label: 'Models' },
  { to: '/cameras', icon: Camera, label: 'Cameras' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useDashboardStore();
  const unreadCount = useAlertStore((s) => s.unreadCount);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={toggleSidebar} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-surface-800/90 backdrop-blur-2xl border-r border-white/[0.04] transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 border-b border-white/[0.04] ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">SentinelAI</h1>
                <p className="text-[9px] text-primary-400/60 font-semibold uppercase tracking-[0.2em]">Surveillance</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Section label */}
        {sidebarOpen && (
          <div className="px-6 pt-5 pb-2">
            <p className="text-[9px] text-gray-600 font-semibold uppercase tracking-[0.15em]">Navigation</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary-600/15 text-primary-400 border border-primary-500/15'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                }
                ${!sidebarOpen ? 'justify-center' : ''}
              `}
              onClick={() => {
                if (window.innerWidth < 768) useDashboardStore.getState().setSidebarOpen(false);
              }}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.label === 'Alerts' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center alert-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        {sidebarOpen && (
          <div className="px-4 pb-3">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Scan className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">System</span>
              </div>
              <p className="text-[10px] text-gray-600">v1.0.0 · ONNX Runtime</p>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center h-12 border-t border-white/[0.04] text-gray-600 hover:text-gray-400 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}
