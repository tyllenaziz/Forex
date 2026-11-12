'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAccount } from '@/context/AccountContext';

export default function DerivPositionsTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SETTLEMENTS'>('ACTIVE');
  const [positions, setPositions] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [now, setNow] = useState(0);
  const { mode } = useAccount();

  const fetchPositions = () => {
    apiFetch(`/api/trading/positions?mode=${mode}`)
      .then(data => {
        const customTrades = data.positions.filter((p: any) => 
          p.type === 'DIGIT' || p.type === 'BINARY'
        );
        setPositions(customTrades);
      })
      .catch(console.error);
  };

  useEffect(() => {
    setIsClient(true);
    setNow(Date.now());
    fetchPositions();
    
    const fetchInterval = setInterval(fetchPositions, 3000);
    const timeInterval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(timeInterval);
    };
  }, [refreshTrigger, mode]);

  const activePositions = positions.filter(p => p.status === 'PENDING');
  const settledPositions = positions.filter(p => p.status === 'WON' || p.status === 'LOST');

  if (!isClient) return <div className="h-64 bg-[#131722] border-t border-gray-800"></div>;

  return (
    <div className="border-t border-gray-800 bg-[#131722] flex flex-col h-64">
      {/* TABS HEADER - PINNED TO THE TOP */}
      <div className="flex border-b border-gray-800 h-10 items-center bg-[#0b0e14] flex-shrink-0">
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-6 h-full text-xs font-semibold transition-colors ${
            activeTab === 'ACTIVE' ? 'text-white border-b-2 border-[#f0b90b]' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          ACTIVE ({activePositions.length})
        </button>
        <button 
          onClick={() => setActiveTab('SETTLEMENTS')}
          className={`px-6 h-full text-xs font-semibold transition-colors ${
            activeTab === 'SETTLEMENTS' ? 'text-white border-b-2 border-[#f0b90b]' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          SETTLEMENTS ({settledPositions.length})
        </button>
      </div>
      
      {/* TABLE CONTENT - SCROLLS UNDERNEATH */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'ACTIVE' ? (
          activePositions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">No active contracts</div>
          ) : (
            <table className="w-full table-auto text-left text-xs text-gray-300">
              <thead className="bg-[#0b0e14] text-gray-500 sticky top-0">
                <tr>
                  <th className="px-6 py-2">ID</th>
                  <th className="px-6 py-2">Asset</th>
                  <th className="px-6 py-2">Trade Type</th>
                  <th className="px-6 py-2">Stake</th>
                  <th className="px-6 py-2">Status</th>
                  <th className="px-6 py-2">Time Remaining</th>
                </tr>
              </thead>
              <tbody>
                {activePositions.map((p) => {
                  const createdTime = new Date(p.created_at).getTime();
                  const expiryTime = createdTime + (p.duration_seconds * 1000);
                  const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
                  
                  return (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-6 py-2 text-gray-500 font-mono text-[10px]">{p.id.slice(0, 8)}</td>
                      <td className="px-6 py-2 font-bold text-white">{p.symbol}</td>
                      <td className="px-6 py-2 text-[#f0b90b] font-bold">
                        {p.type === 'DIGIT' ? `MATCH ${p.digit_prediction}` : `${p.side} / ${p.type}`}
                      </td>
                      <td className="px-6 py-2">${Number(p.volume).toFixed(2)}</td>
                      <td className="px-6 py-2 text-yellow-500 font-semibold">PENDING</td>
                      <td className="px-6 py-2 text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-right">{timeLeft}s</span>
                          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#26a69a] rounded-full transition-all duration-1000 ease-linear"
                              style={{ width: `${(timeLeft / p.duration_seconds) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          settledPositions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-500">No settlements yet</div>
          ) : (
            <table className="w-full table-auto text-left text-xs text-gray-300">
              <thead className="bg-[#0b0e14] text-gray-500 sticky top-0">
                <tr>
                  <th className="px-6 py-2">ID</th>
                  <th className="px-6 py-2">Asset</th>
                  <th className="px-6 py-2">Trade Type</th>
                  <th className="px-6 py-2">Stake</th>
                  <th className="px-6 py-2">Result</th>
                  <th className="px-6 py-2">Payout</th>
                </tr>
              </thead>
              <tbody>
                {settledPositions.map((p) => {
                  const isWin = p.status === 'WON';
                  const multiplier = p.type === 'DIGIT' ? 1.95 : 1.85; 
                  const payout = isWin ? Number(p.volume) * multiplier : 0;
                  
                  return (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-6 py-2 text-gray-500 font-mono text-[10px]">{p.id.slice(0, 8)}</td>
                      <td className="px-6 py-2 font-bold text-white">{p.symbol}</td>
                      <td className="px-6 py-2 text-[#f0b90b] font-bold">
                        {p.type === 'DIGIT' ? `MATCH ${p.digit_prediction}` : `${p.side} / ${p.type}`}
                      </td>
                      <td className="px-6 py-2">${Number(p.volume).toFixed(2)}</td>
                      <td className={`px-6 py-2 font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                        {p.status}
                      </td>
                      <td className={`px-6 py-2 font-bold ${isWin ? 'text-green-500' : 'text-gray-400'}`}>
                        {isWin ? `+$${payout.toFixed(2)}` : '-$0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}