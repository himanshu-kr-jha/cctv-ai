import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useDashboardStore } from '../store/dashboardStore';
import { useSocket } from '../hooks/useSocket';

export default function DashboardLayout() {
  const sidebarOpen = useDashboardStore((s) => s.sidebarOpen);
  useSocket(); // Initialize socket connection

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
