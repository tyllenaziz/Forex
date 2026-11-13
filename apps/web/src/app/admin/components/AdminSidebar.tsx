'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, LogOut, X } from 'lucide-react';

interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/dashboard/users', icon: Users },
    { name: 'Deposits', href: '/admin/dashboard/deposits', icon: ArrowDownToLine },
    { name: 'Pending Deposits', href: '/admin/dashboard/deposits/pending', icon: ArrowDownToLine },
    { name: 'Withdrawals', href: '/admin/dashboard/withdrawals', icon: ArrowUpFromLine },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="w-full md:w-64 bg-[#0b0e14] border-r border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white">SmartTrader</h1>
          <div className="text-[10px] text-[#f0b90b] font-bold tracking-wider">ADMIN CONSOLE</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-400 p-1">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 py-2 overflow-y-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded text-xs md:text-sm font-bold transition-colors mb-1 ${
                isActive ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white hover:bg-[#1e222d]'
              }`}
            >
              <item.icon size={16} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-2">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-[#1e222d] rounded transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}