'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { X } from 'lucide-react';
import { useAccount } from '@/context/AccountContext';

export default function PositionsTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [positions, setPositions] = useState<any[]>([]);
  const { mode } = useAccount();

  const fetchPositions = () => {
    apiFetch(`/api/trading/positions?mode=${mode}`)
      .then(data => setPositions(data.positions))
      .catch(console.error);
  };

  useEffect(() => {
    fetchPositions();
    
    // Auto-refresh every 3 seconds to catch engine closures
    const interval = setInterval(fetchPositions, 3000);
    return () => clearInterval(interval);
  }, [refreshTrigger, mode]);

  const handleClose = async (id: string) => {
    if (!confirm('Are you sure you want to close this position?')) return;
    try {
      const res = await apiFetch(`/api/trading/close/${id}`, { method: 'POST' });
      
      const pnlText = res.pnl >= 0 ? `Profit: $${res.pnl.toFixed(2)}` : `Loss: -$${Math.abs(res.pnl).toFixed(2)}`;
      alert(`Position Closed at ${res.closePrice}\n${pnlText}`);
      
      fetchPositions(); 
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending order?')) return;
    try {
      await apiFetch(`/api/trading/cancel/${id}`, { method: 'POST' });
      alert('Order cancelled successfully');
      fetchPositions(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="h-64 border-t border-gray-800 bg-[#131722] flex flex-col">
      <div className="flex border-b border-gray-800">
        <button className="px-4 py-2 text-xs font-semibold text-white border-b-2 border-blue-500">
          Open Positions & Orders ({mode})
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {positions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-500">No open positions in {mode} account</div>
        ) : (
          <table className="w-full table-auto text-left text-xs text-gray-300">
            <thead className="bg-[#0b0e14] text-gray-500 sticky top-0">
              <tr>
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Side</th>
                <th className="px-4 py-2">Volume</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">S/L</th>
                <th className="px-4 py-2">T/P</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-2 font-bold text-white">{p.symbol}</td>
                  
                  {/* Display MATCH (X) for digit trades */}
                  <td className="px-4 py-2 text-gray-400">
                    {p.type === 'DIGIT' ? `MATCH (${p.digit_prediction})` : p.type}
                  </td>
                  
                  <td className={`px-4 py-2 font-bold ${p.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                    {p.side}
                  </td>
                  <td className="px-4 py-2">{Number(p.volume).toFixed(2)}</td>
                  
                  {/* Show '-' for digit trades since there is no execution price yet */}
                  <td className="px-4 py-2">{p.type === 'DIGIT' ? '-' : (p.price ? Number(p.price).toFixed(5) : '-')}</td>
                  
                  {/* Stop Loss Column */}
                  <td className="px-4 py-2 text-red-400">
                    {p.stop_loss ? Number(p.stop_loss).toFixed(5) : '-'}
                  </td>
                  
                  {/* Take Profit Column */}
                  <td className="px-4 py-2 text-green-400">
                    {p.take_profit ? Number(p.take_profit).toFixed(5) : '-'}
                  </td>
                  
                  <td className={`px-4 py-2 font-semibold ${p.status === 'FILLED' ? 'text-blue-400' : 'text-yellow-500'}`}>
                    {p.status}
                  </td>
                  
                  <td className="px-4 py-2 text-right">
                    {/* Show Close button for FILLED trades */}
                    {p.status === 'FILLED' && p.type !== 'DIGIT' && (
                      <button onClick={() => handleClose(p.id)} className="text-red-500 hover:text-red-400 p-1" title="Close Position">
                        <X size={16} />
                      </button>
                    )}
                    
                    {/* Show Cancel button for PENDING trades */}
                    {p.status === 'PENDING' && p.type !== 'DIGIT' && (
                      <button onClick={() => handleCancel(p.id)} className="text-yellow-500 hover:text-yellow-400 p-1" title="Cancel Order">
                        <X size={16} />
                      </button>
                    )}

                    {/* Show waiting text for pending digit trades */}
                    {p.type === 'DIGIT' && p.status === 'PENDING' && (
                      <span className="text-[10px] text-gray-500 italic">Waiting...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}