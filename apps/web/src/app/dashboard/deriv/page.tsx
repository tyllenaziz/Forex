'use client';
import { useState } from 'react';
import TradingChart from '../components/TradingChart';
import MarketWatch from '../components/MarketWatch';
import DigitPrediction from '../components/DigitPrediction';
import DerivPositionsTable from '../components/DerivPositionsTable';
import { useAccount } from '@/context/AccountContext';
import { apiFetch } from '@/lib/api';
import { X, ListFilter } from 'lucide-react';

export default function DerivTerminal() {
  const { mode } = useAccount();
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [tradeMode, setTradeMode] = useState<'DIGIT' | 'RISE_FALL'>('DIGIT');
  
  const [tradeType, setTradeType] = useState<'DIGIT_EVEN' | 'DIGIT_ODD' | 'DIGIT_OVER' | 'DIGIT_UNDER' | 'DIGIT_MATCH'>('DIGIT_EVEN');
  const [selectedDigit, setSelectedDigit] = useState<number>(0);
  const [stake, setStake] = useState('10');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  // Mobile UI state
  const [isMarketWatchOpen, setIsMarketWatchOpen] = useState(false);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

  const getPrediction = () => {
    if (tradeType === 'DIGIT_EVEN') return 'EVEN';
    if (tradeType === 'DIGIT_ODD') return 'ODD';
    if (tradeType === 'DIGIT_OVER') return 'OVER';
    if (tradeType === 'DIGIT_UNDER') return 'UNDER';
    return selectedDigit.toString();
  };

  const handleTrade = async (direction?: 'RISE' | 'FALL') => {
    try {
      if (direction) {
        await apiFetch('/api/trading/deriv', {
          method: 'POST',
          body: JSON.stringify({
            symbol: selectedSymbol,
            direction,
            amount: parseFloat(stake),
            duration: '1m',
            accountMode: mode,
          }),
        });
        alert(`${direction} Rise/Fall order placed!`);
      } else {
        await apiFetch('/api/trading/digit', {
          method: 'POST',
          body: JSON.stringify({
            symbol: selectedSymbol,
            type: 'DIGIT',
            prediction: getPrediction(),
            volume: parseFloat(stake),
            durationSeconds: 60,
            accountMode: mode,
            takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
            stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          }),
        });
        alert(`Digit Prediction placed!`);
      }
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

      {/* Center - Chart & Predictions */}
      <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0 overflow-hidden h-full pb-16 md:pb-0">
        {/* Mobile Top Bar */}
        <div className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-3 bg-[#131722]">
          <button onClick={() => setIsMarketWatchOpen(true)} className="md:hidden text-gray-400 p-1">
            <ListFilter size={20} />
          </button>
          <div className="font-bold text-base md:text-lg text-white truncate">
            {selectedSymbol}
          </div>
          <div className="md:hidden w-6"></div>
        </div>
        
        {/* Chart - Full height on mobile */}
        <div className="flex-1 min-h-[300px] overflow-hidden">
          <TradingChart symbol={selectedSymbol} />
        </div>
        
        {/* Digit Prediction Panel - Hidden on mobile (in drawer) */}
        <div className="hidden md:block p-4 flex-shrink-0 bg-[#0b0e14] border-t border-gray-800">
          <DigitPrediction onSelectDigit={(num) => { setTradeMode('DIGIT'); setTradeType('DIGIT_MATCH'); setSelectedDigit(num); }} />
        </div>
        
        {/* Positions Table - Hidden on mobile for now */}
        <div className="hidden md:block flex-shrink-0 h-64">
          <DerivPositionsTable refreshTrigger={0} />
        </div>
      </div>

      {/* Desktop Order Panel */}
      <div className="hidden md:flex w-80 bg-[#131722] flex-col h-full border-l border-gray-800">
        <DerivOrderPanel
          tradeMode={tradeMode}
          setTradeMode={setTradeMode}
          tradeType={tradeType}
          setTradeType={setTradeType}
          selectedDigit={selectedDigit}
          stake={stake}
          setStake={setStake}
          takeProfit={takeProfit}
          setTakeProfit={setTakeProfit}
          stopLoss={stopLoss}
          setStopLoss={setStopLoss}
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
            className="bg-[#131722] rounded-t-xl max-h-[50vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 flex justify-between items-center border-b border-gray-800 sticky top-0 bg-[#131722] z-10">
              <span className="font-bold text-xs text-white">Place Order ({selectedSymbol})</span>
              <button onClick={() => setIsOrderPanelOpen(false)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="mobile-compact">
              <DerivOrderPanel
                tradeMode={tradeMode}
                setTradeMode={setTradeMode}
                tradeType={tradeType}
                setTradeType={setTradeType}
                selectedDigit={selectedDigit}
                stake={stake}
                setStake={setStake}
                takeProfit={takeProfit}
                setTakeProfit={setTakeProfit}
                stopLoss={stopLoss}
                setStopLoss={setStopLoss}
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

// Extracted Order Panel for reusability
function DerivOrderPanel({ tradeMode, setTradeMode, tradeType, setTradeType, selectedDigit, stake, setStake, takeProfit, setTakeProfit, stopLoss, setStopLoss, handleTrade, mode }: any) {
  return (
    <div className="p-3 md:p-4">
      {/* Mode Toggle */}
      <div className="flex bg-[#0b0e14] p-1 border border-gray-800 rounded mb-3">
        <button 
          onClick={() => setTradeMode('DIGIT')} 
          className={`flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded transition ${tradeMode === 'DIGIT' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}
        >
          DIGIT
        </button>
        <button 
          onClick={() => setTradeMode('RISE_FALL')} 
          className={`flex-1 py-1.5 text-[10px] md:text-xs font-bold rounded transition ${tradeMode === 'RISE_FALL' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}
        >
          RISE/FALL
        </button>
      </div>

      {/* Digit Tabs */}
      {tradeMode === 'DIGIT' && (
        <div className="flex bg-[#0b0e14] p-0.5 border border-gray-800 rounded mb-3">
          {['DIGIT_EVEN', 'DIGIT_ODD', 'DIGIT_OVER', 'DIGIT_UNDER'].map(t => (
            <button 
              key={t}
              onClick={() => setTradeType(t as any)} 
              className={`flex-1 py-1 text-[9px] md:text-[10px] font-bold rounded ${tradeType === t ? 'bg-[#2a2e39] text-white' : 'text-gray-500'}`}
            >
              {t.replace('DIGIT_', '')}
            </button>
          ))}
        </div>
      )}

      {/* Stake Amount */}
      <div className="mb-2">
        <div className="text-[10px] text-gray-400 mb-1 flex justify-between">
          <span>STAKE AMOUNT</span>
          <span className="text-white">USD</span>
        </div>
        <div className="flex items-center bg-[#0b0e14] border border-gray-700 rounded p-1">
          <span className="text-gray-500 mr-1 text-sm">$</span>
          <input 
            type="number" value={stake} onChange={(e) => setStake(e.target.value)}
            className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-1 mb-3">
        {[1, 5, 10, 20, 50, 100].map(val => (
          <button key={val} onClick={() => setStake(val.toString())} className={`py-0.5 rounded text-[10px] font-bold ${stake === val.toString() ? 'bg-[#f0b90b] text-black' : 'bg-[#2a2e39] text-gray-400'}`}>
            ${val}
          </button>
        ))}
      </div>

      {/* TP / SL - Only for Digit */}
      {tradeMode === 'DIGIT' && (
        <>
          <div className="text-[10px] text-gray-400 mb-1 flex justify-between">
            <span>TAKE PROFIT</span>
            <span className="text-gray-500">Off</span>
          </div>
          <div className="flex items-center bg-[#0b0e14] border border-gray-700 rounded p-1 mb-2">
            <span className="text-green-500 mr-1 text-sm">+</span>
            <input 
              type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="0.00"
              className="w-full bg-transparent text-white text-xs focus:outline-none"
            />
          </div>

          <div className="text-[10px] text-gray-400 mb-1 flex justify-between">
            <span>STOP LOSS</span>
            <span className="text-gray-500">Off</span>
          </div>
          <div className="flex items-center bg-[#0b0e14] border border-gray-700 rounded p-1 mb-3">
            <span className="text-red-500 mr-1 text-sm">-</span>
            <input 
              type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00"
              className="w-full bg-transparent text-white text-xs focus:outline-none"
            />
          </div>
        </>
      )}

      {/* Action Buttons */}
      {tradeMode === 'DIGIT' ? (
        <button onClick={() => handleTrade()} className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black py-2 rounded font-bold text-xs transition">
          PLACE DIGIT TRADE
        </button>
      ) : (
        <div className="flex gap-1">
          <button onClick={() => handleTrade('RISE')} className="flex-1 bg-[#26a69a] hover:bg-[#2bbbad] text-white py-2 rounded font-bold text-xs transition">
            RISE
          </button>
          <button onClick={() => handleTrade('FALL')} className="flex-1 bg-[#ef5350] hover:bg-[#f44336] text-white py-2 rounded font-bold text-xs transition">
            FALL
          </button>
        </div>
      )}

      <div className="mt-3 text-center text-[9px] text-gray-500">
        Mode: {mode}
      </div>
    </div>
  );
}