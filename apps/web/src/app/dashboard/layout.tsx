'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Bell, Settings } from 'lucide-react'; // Removed 'User' as it's unused
import { AccountProvider, useAccount } from '@/context/AccountContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import NotificationBell from './components/NotificationBell';

function Header() {
  const router = useRouter();
  const { mode, setMode } = useAccount();
  const [balance, setBalance] = useState('0.00');

  // Fetch balance whenever mode changes
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

    fetchBalance(); // Initial fetch
    const interval = setInterval(fetchBalance, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [mode]);

    const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="h-14 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-4 bg-[#131722]">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/overview" className="text-xl font-bold text-[#f0b90b]">FX<span className="text-white">Platform</span></Link>
        
        <Link href="/dashboard/overview" className="text-sm text-gray-400 hover:text-white cursor-pointer font-medium">Dashboard</Link>
        
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white cursor-pointer font-medium">Trade</Link>
        <Link href="/dashboard/wallet" className="text-sm text-gray-400 hover:text-white cursor-pointer font-medium">Wallet</Link>
        <Link href="/dashboard/history" className="text-sm text-gray-400 hover:text-white cursor-pointer font-medium">History</Link>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Balance Display (Updates with Mode) */}
        <div className="bg-[#0b0e14] border border-gray-700 rounded px-3 py-1 flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-bold">Balance</span>
          <span className={`text-sm font-bold ${mode === 'DEMO' ? 'text-[#f0b90b]' : 'text-[#26a69a]'}`}>
            ${balance}
          </span>
        </div>

        {/* The Mode Toggle */}
        <div className="flex bg-[#0b0e14] border border-gray-700 rounded p-1">
          <button 
            onClick={() => setMode('DEMO')}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mode === 'DEMO' ? 'bg-[#f0b90b] text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Demo
          </button>
          <button 
            onClick={() => setMode('REAL')}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${mode === 'REAL' ? 'bg-[#26a69a] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Real
          </button>
        </div>
        
                <NotificationBell />

        <Settings size={18} className="text-gray-400 cursor-pointer" />
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition ml-2">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
    <AccountProvider>
      <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col overflow-x-hidden" suppressHydrationWarning>
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </AccountProvider>
  );
}