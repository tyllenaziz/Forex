'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, LogOut } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/dashboard/users', icon: Users },
    { name: 'Deposits', href: '/admin/dashboard/deposits', icon: ArrowDownToLine },
    { name: 'Pending Deposits', href: '/admin/dashboard/deposits/pending', icon: ArrowDownToLine }, // <-- Add this

    { name: 'Withdrawals', href: '/admin/dashboard/withdrawals', icon: ArrowUpFromLine },
  ];

  return (
    <div className="w-64 bg-[#0b0e14] border-r border-gray-800 flex flex-col h-screen shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">SmartTrader</h1>
        <div className="text-[10px] text-[#f0b90b] font-bold mt-1 tracking-wider">ADMIN CONSOLE</div>
      </div>
      
      <nav className="flex-1 py-4 space-y-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                isActive ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white hover:bg-[#1e222d]'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}