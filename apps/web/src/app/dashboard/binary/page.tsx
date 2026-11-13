'use client';
import { useState } from 'react';
import TradingChart from '../components/TradingChart';
import MarketWatch from '../components/MarketWatch';
import DerivPositionsTable from '../components/DerivPositionsTable';
import { useAccount } from '@/context/AccountContext';
import { apiFetch } from '@/lib/api';
import { X, ListFilter } from 'lucide-react';

export default function BinaryTerminal() {
  const { mode } = useAccount();
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [duration, setDuration] = useState('1m');
  const [investment, setInvestment] = useState('10');

  // Mobile UI state
  const [isMarketWatchOpen, setIsMarketWatchOpen] = useState(false);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

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
      setIsOrderPanelOpen(false);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="flex w-full h-[calc(100vh-3.5rem)] bg-[#0b0e14] overflow-hidden relative">
      {/* Desktop Market Watch */}
      <div className="hidden md:block">
        <MarketWatch onSelect={setSelectedSymbol} />
      </div>

      {/* Center - Chart & Positions */}
      <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0 overflow-hidden h-full pb-16 md:pb-0">
        {/* Mobile Top Bar */}
        <div className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-3 bg-[#131722]">
          <button onClick={() => setIsMarketWatchOpen(true)} className="md:hidden text-gray-400 p-1">
            <ListFilter size={20} />
          </button>
          <div className="font-bold text-base md:text-lg text-white truncate">
            {selectedSymbol} <span className="text-[10px] text-[#f0b90b] ml-1">BINARY</span>
          </div>
          <div className="md:hidden w-6"></div>
        </div>
        
        {/* Chart */}
        <div className="flex-1 min-h-[300px] overflow-hidden">
          <TradingChart symbol={selectedSymbol} />
        </div>
        
        {/* Positions Table - Desktop Only */}
        <div className="hidden md:block flex-shrink-0 h-64">
          <DerivPositionsTable refreshTrigger={0} />
        </div>
      </div>

      {/* Desktop Order Panel */}
      <div className="hidden md:flex w-80 bg-[#131722] flex-col h-full border-l border-gray-800">
        <BinaryOrderPanel
          duration={duration}
          setDuration={setDuration}
          investment={investment}
          setInvestment={setInvestment}
          handleTrade={handleTrade}
          mode={mode}
        />
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#131722] border-t border-gray-800 flex z-40">
        <button 
          onClick={() => setIsOrderPanelOpen(true)} 
          className="flex-1 bg-[#f0b90b] text-black font-bold py-4 text-sm"
        >
          Trade {selectedSymbol}
        </button>
      </div>

      {/* Mobile Drawer: Market Watch */}
      {isMarketWatchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onClick={() => setIsMarketWatchOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-48 bg-[#131722]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 flex justify-between items-center border-b border-gray-800">
              <span className="font-bold text-sm text-white">Market</span>
              <button onClick={() => setIsMarketWatchOpen(false)} className="text-gray-400"><X size={16} /></button>
            </div>
            <div className="h-[calc(100%-52px)] overflow-y-auto">
              <MarketWatch onSelect={(s) => { setSelectedSymbol(s); setIsMarketWatchOpen(false); }} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer: Order Panel */}
      {isOrderPanelOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 md:hidden flex flex-col justify-end"
          onClick={() => setIsOrderPanelOpen(false)}
        >
          <div 
            className="bg-[#131722] rounded-t-xl max-h-[40vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 flex justify-between items-center border-b border-gray-800 sticky top-0 bg-[#131722] z-10">
              <span className="font-bold text-xs text-white">Binary ({selectedSymbol})</span>
              <button onClick={() => setIsOrderPanelOpen(false)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="mobile-compact">
              <BinaryOrderPanel
                duration={duration}
                setDuration={setDuration}
                investment={investment}
                setInvestment={setInvestment}
                handleTrade={handleTrade}
                mode={mode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Extracted Binary Order Panel
function BinaryOrderPanel({ duration, setDuration, investment, setInvestment, handleTrade, mode }: any) {
  return (
    <div className="p-3 md:p-4">
      <h2 className="font-bold text-xs md:text-sm text-white mb-2">
        Binary Builder <span className="text-[10px] text-[#f0b90b]">({mode})</span>
      </h2>
      
      <div className="mb-2">
        <label className="text-[10px] text-gray-400 mb-1 block">Contract Duration</label>
        <div className="flex bg-[#0b0e14] rounded p-0.5 border border-gray-800">
          {['30s', '1m', '5m', '15m'].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-1 text-[10px] font-semibold rounded ${
                duration === d ? 'bg-[#f0b90b] text-black' : 'text-gray-500'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <label className="text-[10px] text-gray-400 mb-1 block">Investment (USD)</label>
        <input 
          type="number" value={investment} onChange={(e) => setInvestment(e.target.value)}
          className="w-full bg-[#0b0e14] border border-gray-700 rounded p-1.5 text-white text-xs font-bold focus:outline-none"
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 mb-2 border-t border-gray-800 pt-2">
        <span>Return (85%)</span>
        <span className="text-green-500 font-bold">+${(parseFloat(investment || '0') * 0.85).toFixed(2)}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <button 
          onClick={() => handleTrade('CALL')} 
          className="w-full bg-[#26a69a] hover:bg-[#2bbbad] text-white py-2 rounded font-bold text-xs transition"
        >
          CALL / UP
        </button>
        <button 
          onClick={() => handleTrade('PUT')} 
          className="w-full bg-[#ef5350] hover:bg-[#f44336] text-white py-2 rounded font-bold text-xs transition"
        >
          PUT / DOWN
        </button>
      </div>
    </div>
  );
}