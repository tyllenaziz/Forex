'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin');

    fetch('https://forex-api-dgo5.onrender.com/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUsers(data.users))
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const promoteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to promote this user to SUPER_ADMIN?')) return;
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch(`https://forex-api-dgo5.onrender.com/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'SUPER_ADMIN' })
      });

      if (!res.ok) throw new Error('Promotion failed');
      
      alert('User promoted to Admin successfully!');
      fetchUsers(); // Refresh table
    } catch (err) {
      alert('Failed to promote user');
    }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-white mb-6">User Management</h1>
      
      <div className="bg-[#131722] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#0b0e14] text-gray-500">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">KYC Status</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-6 py-4 font-bold text-white">{u.full_name}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    u.kyc_status === 'APPROVED' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {u.kyc_status}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-[#f0b90b]">{u.role}</td>
                <td className="px-6 py-4 text-right">
                  {u.role === 'USER' && (
                    <button 
                      onClick={() => promoteUser(u.id)}
                      className="bg-[#2a2e39] hover:bg-[#3a3f4b] text-white px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <Shield size={12} /> Make Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}