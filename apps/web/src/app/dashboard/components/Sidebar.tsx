'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Wallet, 
  Settings, 
  History, 
  Zap, 
  Timer,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Forex Trading', href: '/dashboard', icon: TrendingUp },
    { name: 'Deriv Trading', href: '/dashboard/deriv', icon: Zap }, 
    { name: 'Binary Options', href: '/dashboard/binary', icon: Timer }, 
    { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accountMode');
    router.push('/login');
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="w-full md:w-56 bg-[#131722] border-r border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menu</h2>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-400">
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive ? 'bg-[#2a2e39] text-[#f0b90b] border-l-4 border-[#f0b90b]' : 'text-gray-400 hover:text-white hover:bg-[#1e222d]'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Logout Button */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-[#1e222d] rounded transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}