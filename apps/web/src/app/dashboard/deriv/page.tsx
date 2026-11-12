'use client';
import { useState } from 'react';
import TradingChart from '../components/TradingChart';
import MarketWatch from '../components/MarketWatch';
import DigitPrediction from '../components/DigitPrediction';
import DerivPositionsTable from '../components/DerivPositionsTable';
import { useAccount } from '@/context/AccountContext';
import { apiFetch } from '@/lib/api';

export default function DerivTerminal() {
  const { mode } = useAccount();
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD'); // Default to EUR/USD for real data
  const [tradeMode, setTradeMode] = useState<'DIGIT' | 'RISE_FALL'>('DIGIT');
  
  const [tradeType, setTradeType] = useState<'DIGIT_EVEN' | 'DIGIT_ODD' | 'DIGIT_OVER' | 'DIGIT_UNDER' | 'DIGIT_MATCH'>('DIGIT_EVEN');
  const [selectedDigit, setSelectedDigit] = useState<number>(0);

  const [stake, setStake] = useState('10');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

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
        alert(`${direction} Rise/Fall order placed successfully!`);
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
        alert(`Digit Prediction placed successfully!`);
      }
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="flex w-full h-[calc(100vh-3.5rem)] bg-[#0b0e14] overflow-hidden">
      <MarketWatch onSelect={setSelectedSymbol} />

      {/* Center Column - Chart + Bottom Section */}
      <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0 overflow-hidden h-full">
        
        {/* TOP: Chart fills available space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center px-4 justify-between bg-[#131722]">
            <div className="font-bold text-lg text-white">
              {selectedSymbol} <span className="text-xs text-[#f0b90b] ml-2">DERIV</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <TradingChart symbol={selectedSymbol} />
          </div>
        </div>

        {/* BOTTOM: Digit Prediction & Tabs (Fixed Height) */}
        <div className="flex-shrink-0 flex flex-col bg-[#0b0e14] border-t border-gray-800 h-[380px]">
          
          {/* Digit Prediction Rings */}
          <div className="p-4 flex-shrink-0">
            <DigitPrediction onSelectDigit={(num) => { setTradeMode('DIGIT'); setTradeType('DIGIT_MATCH'); setSelectedDigit(num); }} />
          </div>
          
          {/* Active / Settlements Tabs */}
          <div className="flex-1 overflow-y-auto">
            <DerivPositionsTable refreshTrigger={0} />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 bg-[#131722] flex flex-col h-full border-l border-gray-800">
        
        {/* MODE TOGGLE */}
        <div className="flex bg-[#0b0e14] p-1 border-b border-gray-800">
          <button 
            onClick={() => setTradeMode('DIGIT')} 
            className={`flex-1 py-2 text-xs font-bold rounded transition ${tradeMode === 'DIGIT' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}
          >
            DIGIT PREDICTION
          </button>
          <button 
            onClick={() => setTradeMode('RISE_FALL')} 
            className={`flex-1 py-2 text-xs font-bold rounded transition ${tradeMode === 'RISE_FALL' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}
          >
            RISE / FALL
          </button>
        </div>

        {/* DIGIT TABS */}
        {tradeMode === 'DIGIT' && (
          <div className="flex bg-[#0b0e14] p-1 border-b border-gray-800">
            <button onClick={() => setTradeType('DIGIT_EVEN')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${tradeType === 'DIGIT_EVEN' ? 'bg-[#2a2e39] text-white' : 'text-gray-500'}`}>Even</button>
            <button onClick={() => setTradeType('DIGIT_ODD')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${tradeType === 'DIGIT_ODD' ? 'bg-[#2a2e39] text-white' : 'text-gray-500'}`}>Odd</button>
            <button onClick={() => setTradeType('DIGIT_OVER')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${tradeType === 'DIGIT_OVER' ? 'bg-[#2a2e39] text-white' : 'text-gray-500'}`}>Over</button>
            <button onClick={() => setTradeType('DIGIT_UNDER')} className={`flex-1 py-1.5 text-[10px] font-bold rounded ${tradeType === 'DIGIT_UNDER' ? 'bg-[#2a2e39] text-white' : 'text-gray-500'}`}>Under</button>
            {tradeType === 'DIGIT_MATCH' && (
              <div className="flex-1 py-1.5 text-[10px] font-bold rounded bg-[#f0b90b] text-black text-center">
                Match {selectedDigit}
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-b border-gray-800">
          {/* STAKE AMOUNT */}
          <div className="text-xs text-gray-400 mb-2 flex justify-between">
            <span>STAKE AMOUNT</span>
            <span className="text-white">USD</span>
          </div>
          <div className="flex items-center bg-[#0b0e14] border border-gray-700 rounded p-2 mb-3">
            <span className="text-gray-500 mr-2">$</span>
            <input 
              type="number" value={stake} onChange={(e) => setStake(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-lg focus:outline-none"
            />
            <button className="bg-[#2a2e39] px-2 rounded text-gray-400">-</button>
            <button className="bg-[#2a2e39] px-2 rounded text-gray-400 ml-1">+</button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 5, 10, 20, 50, 100].map(val => (
              <button key={val} onClick={() => setStake(val.toString())} className={`py-1 rounded text-xs font-bold ${stake === val.toString() ? 'bg-[#f0b90b] text-black' : 'bg-[#2a2e39] text-gray-400'}`}>
                ${val}
              </button>
            ))}
          </div>

          {/* TP/SL ONLY SHOW FOR DIGITS */}
          {tradeMode === 'DIGIT' && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">TAKE PROFIT</span>
                <span className="text-[10px] text-gray-500">Off</span>
              </div>
              <div className="flex items-center bg-[#0b0e14] border border-gray-700 rounded p-2 mb-4">
                <span className="text-green-500 mr-2">+</span>
                <input 
                  type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="0.00"
                  className="w-full bg-transparent text-white text-sm focus:outline-none"
                />
                <span className="text-gray-500">USD</span>
              </div>
              <div className="grid grid-cols-5 gap-1 mb-4">
                {[10, 25, 50, 100, 200].map(val => (
                  <button key={val} onClick={() => setTakeProfit(val.toString())} className="bg-[#2a2e39] text-gray-400 text-[10px] py-1 rounded">+${val}</button>
                ))}
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">STOP LOSS</span>
                <span className="text-[10px] text-gray-500">Off</span>
              </div>
              <div className="flex items-center bg-[#0b0e14] border border-gray-700 rounded p-2 mb-4">
                <span className="text-red-500 mr-2">-</span>
                <input 
                  type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00"
                  className="w-full bg-transparent text-white text-sm focus:outline-none"
                />
                <span className="text-gray-500">USD</span>
              </div>
              <div className="grid grid-cols-5 gap-1 mb-6">
                {[10, 25, 50, 100, 200].map(val => (
                  <button key={val} onClick={() => setStopLoss(val.toString())} className="bg-[#2a2e39] text-gray-400 text-[10px] py-1 rounded">-${val}</button>
                ))}
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
          {tradeMode === 'DIGIT' ? (
            <button onClick={() => handleTrade()} className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black py-3 rounded font-bold text-sm transition">
              PLACE DIGIT TRADE
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => handleTrade('RISE')} className="flex-1 bg-[#26a69a] hover:bg-[#2bbbad] text-white py-3 rounded font-bold text-sm transition">
                RISE<br/><span className="text-xs font-normal">Payout 95%</span>
              </button>
              <button onClick={() => handleTrade('FALL')} className="flex-1 bg-[#ef5350] hover:bg-[#f44336] text-white py-3 rounded font-bold text-sm transition">
                FALL<br/><span className="text-xs font-normal">Payout 95%</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 flex-1">
           <div className="text-center text-xs text-gray-500 mt-4">
             Powered by FXPlatform Engine
           </div>
        </div>
      </div>
    </div>
  );
}