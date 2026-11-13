'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  return (
    <div className="flex w-full h-screen bg-[#0b0e14] text-white overflow-hidden">
      {/* Desktop Sidebar (always visible on md+) */}
      <div className="hidden md:block h-screen">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0b0e14]" onClick={(e) => e.stopPropagation()}>
            <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0b0e14] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-400 p-1">
              <Menu size={22} />
            </button>
            <span className="text-xs text-gray-400 font-bold">Operations Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="bg-[#2a2e39] hover:bg-[#3a3f4b] text-white px-3 py-1.5 rounded text-xs md:text-sm font-bold flex items-center gap-2 transition">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}