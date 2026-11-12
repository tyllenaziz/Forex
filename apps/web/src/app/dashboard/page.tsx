'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import MarketWatch from './components/MarketWatch';
import TradingChart from './components/TradingChart';
import PositionsTable from './components/PositionsTable';
import Sidebar from './components/Sidebar';
import { useAccount } from '@/context/AccountContext';

export default function Dashboard() {
  const router = useRouter();
  const { mode } = useAccount();
  
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [loading, setLoading] = useState(true);
  const [refreshTable, setRefreshTable] = useState(0);

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
    const interval = setInterval(fetchSummary, 3000); // Refresh every 3 seconds
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
      
      setOrderPrice('');
      setStopLoss('');
      setTakeProfit('');
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="flex w-full h-screen bg-[#0b0e14] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        <MarketWatch onSelect={setSelectedSymbol} />

        <div className="flex-1 flex flex-col border-r border-gray-800 min-w-0 overflow-y-auto h-full">
          <div className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center px-4 justify-between bg-[#131722]">
            <div className="font-bold text-lg text-white">{selectedSymbol}</div>
          </div>
          
          <div className="flex-shrink-0">
            <TradingChart symbol={selectedSymbol} />
          </div>
          
          <div className="flex-shrink-0">
            <PositionsTable refreshTrigger={refreshTable} />
          </div>
        </div>

        {/* RIGHT ORDER PANEL */}
        <div className="w-80 bg-[#131722] flex flex-col h-full">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold text-white mb-4">Place Order <span className={`text-xs ml-2 ${mode === 'DEMO' ? 'text-[#f0b90b]' : 'text-[#26a69a]'}`}>({mode})</span></h2>
            
            {/* Order Type Tabs */}
            <div className="flex bg-[#0b0e14] rounded mb-4 p-1 border border-gray-800">
              {['MARKET', 'LIMIT', 'STOP'].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type as any)}
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
          </div>
          
          {/* UPDATED ACCOUNT INFO PANEL */}
          <div className="p-4 flex-1">
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
              <span className="text-gray-500">Margin:</span>
              <span className="text-white font-medium">${accountSummary.usedMargin}</span>
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
      </div>
    </div>
  );
}