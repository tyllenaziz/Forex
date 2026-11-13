'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Settings, Menu, X } from 'lucide-react';
import { AccountProvider, useAccount } from '@/context/AccountContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import NotificationBell from './components/NotificationBell';
import Sidebar from './components/Sidebar';

function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const { mode, setMode } = useAccount();
  const [balance, setBalance] = useState('0.00');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchBalance = () => {
      apiFetch(`/api/wallet/balance?mode=${mode}`)
        .then((data) => {
          const prefix = mode === 'DEMO' ? 'DEMO:USER_AVAILABLE' : 'REAL:USER_AVAILABLE';
          const available = data.balances.find((b: any) => b.code.startsWith(prefix));
          if (available) setBalance((Number(available.balance_minor) / 100).toFixed(2));
          else setBalance('0.00');
        })
        .catch(console.error);
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-3 md:px-4 bg-[#131722]">
            {/* Left: Hamburger (mobile) + Logo + Desktop Nav */}
      <div className="flex items-center gap-2 md:gap-6">
        <button onClick={onOpenMenu} className="md:hidden text-gray-400 p-1">
          <Menu size={22} />
        </button>
        
                <Link href="/dashboard/overview" className="text-base md:text-xl font-bold text-[#f0b90b]">
          FX<span className="text-white">Platform</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard/overview" className="text-sm text-gray-400 hover:text-white font-medium">Dashboard</Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white font-medium">Trade</Link>
          <Link href="/dashboard/wallet" className="text-sm text-gray-400 hover:text-white font-medium">Wallet</Link>
          <Link href="/dashboard/history" className="text-sm text-gray-400 hover:text-white font-medium">History</Link>
        </div>
      </div>
      
      {/* Right: Balance, Mode Toggle, Icons */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="bg-[#0b0e14] border border-gray-700 rounded px-2 md:px-3 py-1 flex items-center gap-2">
          <span className="hidden md:inline text-[10px] text-gray-500 font-bold">Balance</span>
          <span className={`text-xs md:text-sm font-bold ${mode === 'DEMO' ? 'text-[#f0b90b]' : 'text-[#26a69a]'}`}>
            ${balance}
          </span>
        </div>

        <div className="flex bg-[#0b0e14] border border-gray-700 rounded p-0.5 md:p-1">
          <button 
            onClick={() => setMode('DEMO')}
            className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded transition-colors ${mode === 'DEMO' ? 'bg-[#f0b90b] text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Demo
          </button>
          <button 
            onClick={() => setMode('REAL')}
            className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded transition-colors ${mode === 'REAL' ? 'bg-[#26a69a] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Real
          </button>
        </div>
        
        <NotificationBell />

        <Settings size={18} className="hidden md:block text-gray-400 cursor-pointer" />
        <button onClick={handleLogout} className="hidden md:block text-gray-400 hover:text-red-500 transition ml-2">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AccountProvider>
      <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <Header onOpenMenu={() => setIsSidebarOpen(true)} />
        
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Desktop Sidebar (hidden on mobile) */}
          <div className="hidden md:block h-screen">
            <Sidebar />
          </div>

          {/* Mobile Sidebar Drawer */}
                    {isSidebarOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <div 
  className="absolute left-0 top-0 bottom-0 w-44 bg-[#131722]"
  onClick={(e) => e.stopPropagation()}
>
                <div className="p-4 flex justify-between items-center border-b border-gray-800">
                  <span className="font-bold text-[#f0b90b]">FXPlatform</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400">
                    <X size={20} />
                  </button>
                </div>
                <div className="h-[calc(100%-64px)] overflow-y-auto">
                  <Sidebar />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </AccountProvider>
  );
}