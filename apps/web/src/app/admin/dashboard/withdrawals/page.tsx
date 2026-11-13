'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin');

    fetch('https://forex-api-dgo5.onrender.com/api/admin/withdrawals', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setWithdrawals(data.withdrawals))
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const confirmMsg = action === 'approve' 
      ? 'Are you sure you want to APPROVE this withdrawal? Ensure you have sent the funds.' 
      : 'Are you sure you want to REJECT this withdrawal? The funds will be refunded to the user.';
      
    if (!confirm(confirmMsg)) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`https://forex-api-dgo5.onrender.com/api/admin/${action}-withdrawal/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Action failed');
      
      alert(`Withdrawal ${action}d successfully.`);
      fetchWithdrawals(); // Refresh list
    } catch (err) {
      alert(`Failed to ${action} withdrawal`);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Withdrawal Requests</h1>
      <p className="text-xs text-gray-500 mb-8">Review and approve pending client withdrawals.</p>
      
      <div className="bg-[#131722] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#0b0e14] text-gray-500">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No pending withdrawals found.</td></tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{w.full_name}</div>
                    <div className="text-[10px] text-gray-500">{w.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-500">
                    ${(Number(w.amount_minor) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#f0b90b]/20 text-[#f0b90b] px-2 py-1 rounded text-[10px] font-bold uppercase">
                      {w.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {Object.entries(w.details || {}).map(([key, val]: any) => {
                      if (!val) return null;
                      return (
                        <div key={key}>
                          <span className="capitalize text-gray-500">{key}:</span> {val}
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAction(w.id, 'approve')} className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white p-2 rounded transition" title="Approve">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleAction(w.id, 'reject')} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded transition" title="Reject">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}