'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, DollarSign, ArrowUpFromLine, Activity } from 'lucide-react';

export default function AdminOverview() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalDeposits: 0, pendingWithdrawals: 0, openTrades: 0 });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin');

    // Fetch users
    fetch('http://localhost:4000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUsers(data.users))
      .catch(() => router.push('/admin'));

    // Fetch Stats
    fetch('http://localhost:4000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(console.error);
  }, [router]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="text-[10px] text-[#f0b90b] font-bold tracking-wider mb-1">ADMIN CONSOLE</div>
        <h1 className="text-3xl font-bold text-white">Operations Dashboard</h1>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#131722] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-[#f0b90b]" size={18} />
            <div className="text-xs text-gray-500 font-bold">USERS</div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
        </div>
        
        <div className="bg-[#131722] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-[#26a69a]" size={18} />
            <div className="text-xs text-gray-500 font-bold">DEPOSITS</div>
          </div>
          <div className="text-3xl font-bold text-white">${stats.totalDeposits.toFixed(2)}</div>
          <div className="text-[10px] text-gray-500 mt-1">Total approved</div>
        </div>
        
        <div className="bg-[#131722] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpFromLine className="text-red-500" size={18} />
            <div className="text-xs text-gray-500 font-bold">WITHDRAWALS</div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.pendingWithdrawals}</div>
          <div className="text-[10px] text-gray-500 mt-1">pending requests</div>
        </div>
        
        <div className="bg-[#131722] p-6 rounded-xl border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-gray-400" size={18} />
            <div className="text-xs text-gray-500 font-bold">OPEN TRADES</div>
          </div>
          <div className="text-3xl font-bold text-white">{stats.openTrades}</div>
          <div className="text-[10px] text-gray-500 mt-1">live exposure</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-[#131722] rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <div className="font-bold text-gray-300 text-sm">RECENT USERS</div>
            <button onClick={() => router.push('/admin/dashboard/users')} className="text-xs text-[#f0b90b]">View All</button>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <tbody>
              {users.slice(0, 5).map(u => (
                <tr 
                  key={u.id} 
                  onClick={() => router.push('/admin/dashboard/users')}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">{u.full_name}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-green-500">{u.kyc_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#131722] rounded-xl border border-gray-800 p-6">
           <div className="font-bold text-gray-300 text-sm mb-4">QUICK ACTIONS</div>
           <div className="flex flex-col gap-3">
             <button onClick={() => router.push('/admin/dashboard/deposits/pending')} className="bg-[#0b0e14] hover:bg-[#1e222d] text-left px-4 py-3 rounded border border-gray-800 text-sm font-bold text-gray-300 flex justify-between">
               Review Pending Deposits <span className="text-[#f0b90b]">→</span>
             </button>
             <button onClick={() => router.push('/admin/dashboard/withdrawals')} className="bg-[#0b0e14] hover:bg-[#1e222d] text-left px-4 py-3 rounded border border-gray-800 text-sm font-bold text-gray-300 flex justify-between">
               Review Withdrawals <span className="text-[#f0b90b]">→</span>
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}