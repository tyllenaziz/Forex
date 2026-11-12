'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAccount } from '@/context/AccountContext';
import Sidebar from '../components/Sidebar';
import { History, CheckCircle, XCircle } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { mode } = useAccount();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');

    apiFetch(`/api/trading/history?mode=${mode}`)
      .then((data) => setHistory(data.history))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router, mode]);

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="flex w-full h-screen bg-[#0b0e14] overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <History size={24} className="text-[#f0b90b]"/> Trade History
              </h1>
              <p className="text-sm text-gray-500 mt-1">All closed trades for your {mode} account.</p>
            </div>
          </div>

          <div className="bg-[#131722] rounded-xl border border-gray-800 overflow-x-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No closed trades yet.</div>
            ) : (
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#0b0e14] text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Symbol</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Side</th>
                    <th className="px-6 py-3">Volume</th>
                    <th className="px-6 py-3">Open Price</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => {
                    const isWin = h.status === 'WON';
                    const isLoss = h.status === 'LOST';
                    return (
                      <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-6 py-4 text-gray-400">{new Date(h.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-white">{h.symbol}</td>
                        <td className="px-6 py-4 text-gray-400">
                          {h.type === 'DIGIT' ? `MATCH (${h.digit_prediction})` : h.type}
                        </td>
                        <td className={`px-6 py-4 font-bold ${h.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                          {h.side}
                        </td>
                        <td className="px-6 py-4">{Number(h.volume).toFixed(2)}</td>
                        <td className="px-6 py-4">{h.price ? Number(h.price).toFixed(5) : '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1 font-bold ${
                            isWin ? 'text-green-500' : isLoss ? 'text-red-500' : 'text-blue-400'
                          }`}>
                            {isWin ? <CheckCircle size={14} /> : isLoss ? <XCircle size={14} /> : null}
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}