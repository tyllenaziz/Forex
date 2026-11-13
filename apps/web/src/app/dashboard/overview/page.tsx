'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAccount } from '@/context/AccountContext';
import { Wallet, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  const router = useRouter();
  const { mode } = useAccount();
  const [balance, setBalance] = useState('0.00');
  const [stats, setStats] = useState<any>({
    totalTrades: 0, winRate: '0.0', totalPnl: '0.00', openTrades: 0, recentTrades: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');

    // Fetch Balance
    apiFetch(`/api/wallet/balance?mode=${mode}`)
      .then((data) => {
        const prefix = mode === 'DEMO' ? 'DEMO:USER_AVAILABLE' : 'REAL:USER_AVAILABLE';
        const available = data.balances.find((b: any) => b.code.startsWith(prefix));
        if (available) setBalance((Number(available.balance_minor) / 100).toFixed(2));
      })
      .catch(() => router.push('/'));

    // Fetch Stats
    apiFetch(`/api/trading/stats?mode=${mode}`)
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router, mode]);

  if (loading) return <div className="p-10 text-white">Loading...</div>;

    return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto">
          
          {/* Top Equity Card */}
          <div className="bg-[#131722] rounded-xl border border-gray-800 p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#f0b90b]"></div>
            <div className="text-sm text-gray-400 font-semibold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f0b90b]"></span> SPOT & TRADING EQUITY ({mode})
            </div>
            <div className="text-5xl font-bold text-white mb-2">${balance}</div>
            <div className={`text-sm font-medium ${Number(stats.totalPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(stats.totalPnl) >= 0 ? '+' : ''}${stats.totalPnl} from recent closed trades
            </div>
            
            <div className="flex gap-4 mt-8">
              <Link href="/dashboard/wallet" className="flex items-center gap-2 bg-[#2a2e39] hover:bg-[#3a3f4b] px-4 py-2 rounded text-sm font-semibold transition">
                <Wallet size={16} /> Deposit
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 bg-[#2a2e39] hover:bg-[#3a3f4b] px-4 py-2 rounded text-sm font-semibold transition">
                <TrendingUp size={16} /> Trade
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#131722] p-5 rounded-lg border border-gray-800">
              <div className="text-xs text-gray-500 font-semibold mb-2">Total Profit</div>
              <div className={`text-2xl font-bold mb-1 ${Number(stats.totalPnl) >= 0 ? 'text-white' : 'text-red-500'}`}>
                ${stats.totalPnl}
              </div>
              <div className="text-xs text-green-500">realised PnL</div>
            </div>
            <div className="bg-[#131722] p-5 rounded-lg border border-gray-800">
              <div className="text-xs text-gray-500 font-semibold mb-2">Win Rate</div>
              <div className="text-2xl font-bold text-white mb-1">{stats.winRate}%</div>
              <div className="text-xs text-gray-400">{stats.totalTrades} trades</div>
            </div>
            <div className="bg-[#131722] p-5 rounded-lg border border-gray-800">
              <div className="text-xs text-gray-500 font-semibold mb-2">Open Trades</div>
              <div className="text-2xl font-bold text-white mb-1">{stats.openTrades}</div>
              <div className="text-xs text-gray-400">live positions</div>
            </div>
            <div className="bg-[#131722] p-5 rounded-lg border border-gray-800">
              <div className="text-xs text-gray-500 font-semibold mb-2">Total Trades</div>
              <div className="text-2xl font-bold text-white mb-1">{stats.totalTrades}</div>
              <div className="text-xs text-gray-400">all-time</div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-[#131722] rounded-xl border border-gray-800 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-gray-400">📊 RECENT EXECUTED TRADES</h2>
              <Link href="/dashboard/history" className="text-xs text-[#f0b90b] hover:text-yellow-400">View History →</Link>
            </div>
            
            {stats.recentTrades.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-300 font-semibold mb-2">No trades yet</div>
                <div className="text-sm text-gray-500 mb-6">Open your first trade and it will appear here.</div>
                <Link href="/dashboard" className="bg-[#f0b90b] text-black px-6 py-2 rounded font-bold text-sm hover:bg-yellow-500 transition">
                  Start Trading
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0b0e14] text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2">Volume</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTrades.map((t: any) => (
                      <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-white">{t.symbol}</td>
                        <td className={`px-4 py-3 font-bold ${t.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{t.side}</td>
                        <td className="px-4 py-3">{Number(t.volume).toFixed(2)}</td>
                        <td className="px-4 py-3 flex items-center gap-1 font-bold">
                          {t.status === 'WON' || t.status === 'CLOSED' ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                          <span className={t.status === 'WON' || t.status === 'CLOSED' ? 'text-green-500' : 'text-red-500'}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#131722] rounded-xl border border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold text-gray-400">📈 PROFIT & LOSS CHART</h2>
                <div className="text-xs text-gray-500 flex gap-2">
                  <span className="text-white">1W</span><span>1M</span><span>3M</span><span>6M</span><span>1Y</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-40">
                {/* Dynamic bars based on win rate */}
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm opacity-80 ${Number(stats.totalPnl) >= 0 ? 'bg-[#26a69a]' : 'bg-[#ef5350]'}`} style={{ height: `${Math.max(10, Math.min(100, Number(stats.winRate) + (Math.random() * 20 - 10)))}%` }}></div>
                ))}
              </div>
            </div>

            <div className="bg-[#131722] rounded-xl border border-gray-800 p-6">
              <h2 className="text-sm font-bold text-gray-400 mb-6">🔔 RECENT ALERTS</h2>
              <div className="text-center mt-12">
                <div className="text-gray-400 font-semibold text-sm mb-1">No alerts yet</div>
                <div className="text-xs text-gray-500">Platform and trade notifications will appear here.</div>
              </div>
            </div>
          </div>

           </div>
    </div>
  );
}