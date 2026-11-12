'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PendingDepositsPage() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return router.push('/admin');

    fetch('http://localhost:4000/api/admin/pending-deposits', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setDeposits(data.deposits))
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to APPROVE this deposit and credit the user?')) return;
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch(`http://localhost:4000/api/admin/approve-deposit/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Approval failed');
      
      alert('Deposit approved and credited successfully!');
      fetchDeposits(); 
    } catch (err) {
      alert('Failed to approve deposit');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to REJECT this deposit? The funds will not be credited.')) return;
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch(`http://localhost:4000/api/admin/reject-deposit/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Rejection failed');
      
      alert('Deposit rejected.');
      fetchDeposits(); 
    } catch (err) {
      alert('Failed to reject deposit');
    }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Pending Deposits</h1>
      <p className="text-xs text-gray-500 mb-8">Review user deposit requests. Approved deposits are credited instantly. Rejected deposits are removed.</p>
      
      <div className="bg-[#131722] rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#0b0e14] text-gray-500">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Amount (USD)</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Details Submitted</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {deposits.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No pending deposits found.</td></tr>
            ) : (
              deposits.map((d) => (
                <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{d.full_name}</div>
                    <div className="text-[10px] text-gray-500">{d.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#26a69a]">
                    ${(Number(d.amount_minor) / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#f0b90b]/20 text-[#f0b90b] px-2 py-1 rounded text-[10px] font-bold uppercase">
                      {d.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {Object.entries(d.details || {}).map(([key, val]: any) => {
                      if (!val) return null;
                      if (key === 'originalCurrency') return null;
                      
                      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                      const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);

                      return (
                        <div key={key} className="mb-1">
                          <span className="text-gray-500">{capitalizedKey}:</span> <span className="text-gray-300">{val}</span>
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleApprove(d.id)}
                        className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white px-3 py-2 rounded font-bold text-xs transition inline-flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleReject(d.id)}
                        className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded font-bold text-xs transition inline-flex items-center gap-1"
                      >
                        <XCircle size={14} /> Reject
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