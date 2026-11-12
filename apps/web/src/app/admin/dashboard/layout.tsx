'use client';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../components/AdminSidebar';
import { LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  return (
    <div className="flex w-full h-screen bg-[#0b0e14] text-white overflow-hidden">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0b0e14]">
          <div className="text-sm font-bold text-gray-400">Operations Panel</div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="bg-[#2a2e39] hover:bg-[#3a3f4b] text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition">
              <LogOut size={16} /> Logout
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