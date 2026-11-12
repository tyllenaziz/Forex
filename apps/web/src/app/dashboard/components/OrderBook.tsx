'use client';
import { useEffect, useState } from 'react';

export default function OrderBook({ symbol }: { symbol: string }) {
  const [bids, setBids] = useState<any[]>([]);
  const [asks, setAsks] = useState<any[]>([]);

  useEffect(() => {
    // Simulate Order Book data based on the selected symbol
    const basePrice = symbol.includes('JPY') ? 150.20 : 1.0850;
    
    const generateOrders = () => {
      const newBids = [];
      const newAsks = [];
      for (let i = 0; i < 8; i++) {
        newBids.push({
          price: (basePrice - 0.0001 * (i + 1)).toFixed(symbol.includes('JPY') ? 3 : 5),
          size: (Math.random() * 2).toFixed(2),
          total: (Math.random() * 10).toFixed(2),
        });
        newAsks.push({
          price: (basePrice + 0.0001 * (i + 1)).toFixed(symbol.includes('JPY') ? 3 : 5),
          size: (Math.random() * 2).toFixed(2),
          total: (Math.random() * 10).toFixed(2),
        });
      }
      setBids(newBids.reverse());
      setAsks(newAsks);
    };

    generateOrders();
    const interval = setInterval(generateOrders, 3000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="h-48 bg-[#131722] flex flex-col border-t border-gray-800">
      <div className="flex items-center px-3 py-1 border-b border-gray-800 text-[10px] text-gray-400 font-semibold">
        <div className="w-1/3">PRICE</div>
        <div className="w-1/3 text-right">SIZE</div>
        <div className="w-1/3 text-right">TOTAL</div>
      </div>
      <div className="flex-1 overflow-y-auto text-[11px] font-mono">
        {/* Asks (Sells) */}
        {asks.map((ask, i) => (
          <div key={`ask-${i}`} className="flex px-3 py-[2px] hover:bg-gray-800/50 relative">
            <div className="absolute inset-0 bg-red-500/10" style={{ width: `${(parseFloat(ask.size) / 2) * 100}%`, right: 0, left: 'auto' }}></div>
            <div className="w-1/3 text-red-500 relative z-10">{ask.price}</div>
            <div className="w-1/3 text-right text-gray-300 relative z-10">{ask.size}</div>
            <div className="w-1/3 text-right text-gray-400 relative z-10">{ask.total}</div>
          </div>
        ))}
        
        {/* Spread */}
        <div className="flex px-3 py-1 justify-between items-center bg-[#1e222d] border-y border-gray-700">
          <span className="text-white font-bold text-sm">
            {((parseFloat(asks[0]?.price || 0) + parseFloat(bids[bids.length - 1]?.price || 0)) / 2).toFixed(5)}
          </span>
          <span className="text-[10px] text-gray-400">Spread</span>
        </div>

        {/* Bids (Buys) */}
        {bids.map((bid, i) => (
          <div key={`bid-${i}`} className="flex px-3 py-[2px] hover:bg-gray-800/50 relative">
            <div className="absolute inset-0 bg-green-500/10" style={{ width: `${(parseFloat(bid.size) / 2) * 100}%`, right: 0, left: 'auto' }}></div>
            <div className="w-1/3 text-green-500 relative z-10">{bid.price}</div>
            <div className="w-1/3 text-right text-gray-300 relative z-10">{bid.size}</div>
            <div className="w-1/3 text-right text-gray-400 relative z-10">{bid.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}