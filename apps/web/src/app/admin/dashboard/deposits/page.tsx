'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, CheckCircle } from 'lucide-react';

export default function AdminDepositsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('100');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin');

    fetch('https://forex-api-dgo5.onrender.com/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setUsers(data.users);
        if (data.users.length > 0) setSelectedUser(data.users[0].id);
      })
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    if (!selectedUser) return alert('Please select a user');

    try {
      const res = await fetch('https://forex-api-dgo5.onrender.com/api/admin/deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: selectedUser, amount: parseFloat(amount), currency: 'USD' })
      });

      if (!res.ok) throw new Error('Deposit failed');
      
      alert('Real Deposit credited successfully!');
      setAmount('100');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Deposit Management</h1>
      <p className="text-xs text-gray-500 mb-8">Manually credit a user's REAL account. This will be logged in the double-entry ledger.</p>
      
      <div className="bg-[#131722] p-6 rounded-xl border border-gray-800 mb-8">
        <h2 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-[#26a69a]"/> Manual Real Deposit (Admin Override)
        </h2>
      <form onSubmit={handleDeposit} className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-end">
                  <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Select User</label>
            
            {/* FIXED: The select tag is properly wrapped here */}
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email} - {u.full_name}</option>
              ))}
            </select>
          </div>
          
          <div className="w-48">
            <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 pl-9 text-white focus:outline-none focus:border-[#f0b90b]"
              />
            </div>
          </div>
          <button type="submit" className="bg-[#f0b90b] hover:bg-yellow-500 text-black px-6 py-3 rounded font-bold transition">
            Credit Account
          </button>
        </form>
      </div>
    </div>
  );
}