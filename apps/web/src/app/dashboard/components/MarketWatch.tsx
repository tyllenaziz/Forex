'use client';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import OrderBook from './OrderBook';

const SYMBOLS = [
  { symbol: 'EUR/USD', category: 'Forex' },
  { symbol: 'GBP/USD', category: 'Forex' },
  { symbol: 'USD/JPY', category: 'Forex' },
  { symbol: 'AUD/USD', category: 'Forex' },
  { symbol: 'USD/CAD', category: 'Forex' },
  { symbol: 'XAU/USD', category: 'Metals' },
  { symbol: 'XAG/USD', category: 'Metals' },
  { symbol: 'BTC/USD', category: 'Crypto' },
  { symbol: 'ETH/USD', category: 'Crypto' },
  { symbol: 'US30', category: 'Indices' },
  { symbol: 'NAS100', category: 'Indices' },
  { symbol: 'SPX500', category: 'Indices' },
];

const CATEGORIES = ['All', 'Forex', 'Metals', 'Crypto', 'Indices'];

export default function MarketWatch({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [markets, setMarkets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeSymbol, setActiveSymbol] = useState('EUR/USD');

  useEffect(() => {
    // 1. Initialize with static data so it doesn't look empty
    setMarkets(SYMBOLS.map(s => ({ ...s, bid: 0, change: '0.00' })));

    // 2. Connect to WebSocket (hardcoded production URL)
    const ws = new WebSocket('wss://forex-api-dgo5.onrender.com/ws/prices');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'PRICE_UPDATE') {
        const updatedPrices = message.data;
        
        setMarkets(prev => prev.map(m => {
          const newPrice = updatedPrices[m.symbol];
          if (newPrice) {
            return { ...m, bid: newPrice.bid, change: newPrice.change };
          }
          return m;
        }));
      }
    };

    ws.onerror = (err) => console.error("WebSocket Error:", err);

    return () => {
      ws.close();
    };
  }, []);

  const handleSelect = (symbol: string) => {
    setActiveSymbol(symbol);
    onSelect(symbol);
  };

  const filtered = markets.filter(m => {
    const matchesSearch = m.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' || m.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="w-full md:w-56 border-r border-gray-800 bg-[#131722] flex flex-col h-full overflow-hidden">
                                      <div className="grid grid-cols-2 gap-px bg-gray-800 border-b border-gray-800">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`py-1 text-[8px] font-bold truncate transition-colors ${
              activeTab === cat ? 'text-blue-500 bg-[#1e222d]' : 'text-gray-500 bg-[#131722] hover:bg-[#1e222d]'
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="p-2 border-b border-gray-800">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2 text-gray-500" />
          <input 
            type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0b0e14] text-xs text-white pl-8 pr-2 py-1.5 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filtered.map((m) => (
          <div
            key={m.symbol} onClick={() => handleSelect(m.symbol)}
            className={`p-2 border-b border-gray-800/50 cursor-pointer flex justify-between items-center group ${
              activeSymbol === m.symbol ? 'bg-gray-800' : 'hover:bg-gray-800/50'
            }`}
          >
            <div>
              <div className="font-bold text-xs group-hover:text-blue-400">{m.symbol}</div>
              <div className="text-[9px] text-gray-500">{m.category}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white">{m.bid ? Number(m.bid).toFixed(5) : '...'}</div>
              <div className={`text-[10px] ${m.change && !m.change.startsWith('-') ? 'text-green-500' : 'text-red-500'}`}>
                {m.change ? `${m.change}%` : '0%'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <OrderBook symbol={activeSymbol} />
    </div>
  );
}