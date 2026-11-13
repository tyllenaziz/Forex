'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import MarketWatch from './components/MarketWatch';
import TradingChart from './components/TradingChart';
import PositionsTable from './components/PositionsTable';

import { useAccount } from '@/context/AccountContext';
import { X, ListFilter } from 'lucide-react';
export default function Dashboard() {
  const router = useRouter();
  const { mode } = useAccount();
  
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [loading, setLoading] = useState(true);
  const [refreshTable, setRefreshTable] = useState(0);

  // Mobile UI State
  const [isMarketWatchOpen, setIsMarketWatchOpen] = useState(false);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

  // Account Summary State
  const [accountSummary, setAccountSummary] = useState<any>({
    balance: '0.00',
    equity: '0.00',
    floatingPnl: '0.00',
    usedMargin: '0.00',
    freeMargin: '0.00',
    marginLevel: '0.00',
  });

  // Order Form State
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [volume, setVolume] = useState('0.10');
  const [orderPrice, setOrderPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');

    const fetchSummary = () => {
      apiFetch(`/api/trading/account-summary?mode=${mode}`)
        .then((data) => {
          setAccountSummary(data);
          setLoading(false);
        })
        .catch(console.error);
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 3000);
    return () => clearInterval(interval);
  }, [router, mode]);

  const handleTrade = async (side: 'BUY' | 'SELL') => {
    try {
      const payload = {
        symbol: selectedSymbol,
        side,
        type: orderType,
        volume: parseFloat(volume),
        price: orderType !== 'MARKET' ? parseFloat(orderPrice) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        accountMode: mode,
      };

      const res = await apiFetch('/api/trading/order', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      alert(`${side} ${orderType} Order placed! Status: ${res.order.status}`);
      setRefreshTable(prev => prev + 1);
      setIsOrderPanelOpen(false); // Close mobile panel after trade
      
      setOrderPrice('');
      setStopLoss('');
      setTakeProfit('');
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="flex w-full h-screen bg-[#0b0e14] overflow-hidden relative">
      {/* Sidebar - Hidden on Mobile, Visible on Desktop */}
     

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Market Watch - Hidden on Mobile, Visible on Desktop */}
        <div className="hidden md:block">
          <MarketWatch onSelect={setSelectedSymbol} />
        </div>

        {/* Main Chart Area */}
        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0 overflow-y-auto h-full pb-20 md:pb-0">          
                    {/* Mobile Top Bar */}
          <div className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-4 bg-[#131722]">
            <button onClick={() => setIsMarketWatchOpen(true)} className="md:hidden text-gray-400 p-1">
              <ListFilter size={20} />
            </button>
            <div className="font-bold text-lg text-white">{selectedSymbol}</div>
            <div className="md:hidden"></div>
          </div>
                {/* FIXED BOTTOM BAR (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#131722] border-t border-gray-800 flex z-40">
        <button 
          onClick={() => setIsOrderPanelOpen(true)} 
          className="flex-1 bg-[#f0b90b] text-black font-bold py-4 text-sm"
        >
          Trade {selectedSymbol}
        </button>
      </div>
          {/* Chart */}
          <div className="flex-1 min-h-[400px] md:min-h-0 relative">
            <TradingChart symbol={selectedSymbol} />
          </div>
          
          {/* Positions Table */}
          <div className="flex-shrink-0">
            <PositionsTable refreshTrigger={refreshTable} />
          </div>
        </div>

        {/* Order Panel - Hidden on Mobile, Visible on Desktop */}
        <div className="hidden md:flex w-80 bg-[#131722] flex-col h-full">
          <OrderPanel 
            mode={mode}
            orderType={orderType}
            setOrderType={setOrderType}
            volume={volume}
            setVolume={setVolume}
            orderPrice={orderPrice}
            setOrderPrice={setOrderPrice}
            stopLoss={stopLoss}
            setStopLoss={setStopLoss}
            takeProfit={takeProfit}
            setTakeProfit={setTakeProfit}
            handleTrade={handleTrade}
            accountSummary={accountSummary}
          />
        </div>
      </div>

            {/* MOBILE DRAWER: Market Watch */}
      {isMarketWatchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onClick={() => setIsMarketWatchOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-40 bg-[#131722]"
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

           {/* MOBILE DRAWER: Order Panel */}
          {isOrderPanelOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 md:hidden flex flex-col justify-end"
          onClick={() => setIsOrderPanelOpen(false)}
        >
          <div 
  className="bg-[#131722] rounded-t-xl max-h-[30vh] overflow-y-auto"
  onClick={(e) => e.stopPropagation()}
>
            <div className="p-2 flex justify-between items-center border-b border-gray-800 sticky top-0 bg-[#131722] z-10">
              <span className="font-bold text-xs text-white">Place Order ({selectedSymbol})</span>
              <button onClick={() => setIsOrderPanelOpen(false)} className="text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="mobile-compact">
              <OrderPanel 
                mode={mode}
                orderType={orderType}
                setOrderType={setOrderType}
                volume={volume}
                setVolume={setVolume}
                orderPrice={orderPrice}
                setOrderPrice={setOrderPrice}
                stopLoss={stopLoss}
                setStopLoss={setStopLoss}
                takeProfit={takeProfit}
                setTakeProfit={setTakeProfit}
                handleTrade={handleTrade}
                accountSummary={accountSummary}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Extract the Order Panel into a sub-component so it can be used in both desktop and mobile views
function OrderPanel({ mode, orderType, setOrderType, volume, setVolume, orderPrice, setOrderPrice, stopLoss, setStopLoss, takeProfit, setTakeProfit, handleTrade, accountSummary }: any) {
  return (
    <div className="p-4">
      <div className="flex bg-[#0b0e14] rounded mb-4 p-1 border border-gray-800">
        {['MARKET', 'LIMIT', 'STOP'].map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 text-xs py-1.5 rounded font-semibold transition ${
              orderType === type ? 'bg-[#2a2e39] text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Volume (Lots)</label>
        <input 
          type="number" value={volume} onChange={(e) => setVolume(e.target.value)}
          className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {orderType !== 'MARKET' && (
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1 block">Price</label>
          <input 
            type="number" value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)}
            placeholder="0.00000"
            className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Stop Loss</label>
          <input 
            type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Optional"
            className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-400 mb-1 block">Take Profit</label>
          <input 
            type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Optional"
            className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => handleTrade('BUY')} className="flex-1 bg-[#26a69a] hover:bg-[#2bbbad] text-white py-3 rounded font-bold text-sm transition">
          BUY<br/><span className="text-xs font-normal">{orderType}</span>
        </button>
        <button onClick={() => handleTrade('SELL')} className="flex-1 bg-[#ef5350] hover:bg-[#f44336] text-white py-3 rounded font-bold text-sm transition">
          SELL<br/><span className="text-xs font-normal">{orderType}</span>
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Account Info</h3>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Balance:</span>
          <span className="text-white font-medium">${accountSummary.balance}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Equity:</span>
          <span className="text-white font-medium">${accountSummary.equity}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Floating PnL:</span>
          <span className={`font-medium ${Number(accountSummary.floatingPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${accountSummary.floatingPnl}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Free Margin:</span>
          <span className="text-white font-medium">${accountSummary.freeMargin}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Margin Level:</span>
          <span className={`font-medium ${Number(accountSummary.marginLevel) < 100 ? 'text-red-500' : 'text-green-500'}`}>
            {accountSummary.marginLevel}%
          </span>
        </div>
      </div>
    </div>
  );
}