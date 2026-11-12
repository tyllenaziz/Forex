'use client';
import { useState } from 'react';
import TradingChart from '../components/TradingChart';
import MarketWatch from '../components/MarketWatch';
import DerivPositionsTable from '../components/DerivPositionsTable';
import { useAccount } from '@/context/AccountContext';
import { apiFetch } from '@/lib/api';

export default function BinaryTerminal() {
  const { mode } = useAccount();
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [duration, setDuration] = useState('1m');
  const [investment, setInvestment] = useState('10');

  const handleTrade = async (direction: 'CALL' | 'PUT') => {
    try {
      await apiFetch('/api/trading/binary', {
        method: 'POST',
        body: JSON.stringify({
          symbol: selectedSymbol,
          direction,
          amount: parseFloat(investment),
          duration,
          accountMode: mode,
        }),
      });
      
      alert(`${direction} Binary Order placed successfully!`);
      window.location.reload(); 
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="flex w-full h-[calc(100vh-3.5rem)] bg-[#0b0e14] overflow-hidden">
      <MarketWatch onSelect={setSelectedSymbol} />

      {/* Center - Chart & Positions Table */}
      <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0 overflow-hidden">
        <div className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center px-4 justify-between bg-[#131722]">
          <div className="font-bold text-lg text-white">
            {selectedSymbol} <span className="text-xs text-[#f0b90b] ml-2">BINARY</span>
          </div>
        </div>
        
        {/* Chart takes up the remaining space */}
        <div className="flex-1 overflow-hidden">
          <TradingChart symbol={selectedSymbol} />
        </div>
        
        {/* Table is pinned to the bottom */}
        <div className="flex-shrink-0">
          <DerivPositionsTable refreshTrigger={0} />
        </div>
      </div>

      {/* Right Sidebar - Order Panel */}
      <div className="w-80 bg-[#131722] flex flex-col h-full border-l border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-bold text-white mb-4">
            Binary Builder <span className="text-xs text-[#f0b90b] ml-2">({mode})</span>
          </h2>
          
          <div className="mb-6">
            <label className="text-xs text-gray-400 mb-2 block">Contract Duration</label>
            <div className="flex bg-[#0b0e14] rounded p-1 border border-gray-800">
              {['30s', '1m', '5m', '15m'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 text-xs py-1.5 rounded font-semibold transition ${
                    duration === d ? 'bg-[#f0b90b] text-black' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs text-gray-400 mb-2 block">Investment (USD)</label>
            <input 
              type="number" value={investment} onChange={(e) => setInvestment(e.target.value)}
              className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500 font-bold"
            />
          </div>

          <div className="flex justify-between text-xs text-gray-400 mb-6 border-t border-gray-800 pt-4">
            <span>Return (85%)</span>
            <span className="text-green-500 font-bold">+${(parseFloat(investment) * 0.85).toFixed(2)}</span>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleTrade('CALL')} 
              className="w-full bg-[#26a69a] hover:bg-[#2bbbad] text-white py-4 rounded font-bold text-sm transition flex flex-col items-center"
            >
              <span>CALL / UP</span>
              <span className="text-xs font-normal mt-1">Price will rise</span>
            </button>
            <button 
              onClick={() => handleTrade('PUT')} 
              className="w-full bg-[#ef5350] hover:bg-[#f44336] text-white py-4 rounded font-bold text-sm transition flex flex-col items-center"
            >
              <span>PUT / DOWN</span>
              <span className="text-xs font-normal mt-1">Price will fall</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 flex-1">
           <div className="text-center text-xs text-gray-500 mt-10">
             Binary execution engine connected (Simulation Mode)
           </div>
        </div>
      </div>
    </div>
  );
}