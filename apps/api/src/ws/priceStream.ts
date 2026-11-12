import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { BiquoteProvider } from '../providers/marketdata/biquote.js';

export function startPriceStream(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/prices' });
  const marketData = new BiquoteProvider();
  
  // The list of symbols to stream
  const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD'];

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 New client connected to Price Stream');

    ws.on('close', () => {
      console.log('🔌 Client disconnected');
    });
  });

  // Broadcast prices to all connected clients every 1 second
  setInterval(async () => {
    if (wss.clients.size === 0) return; // Don't fetch if no one is listening

    const prices: Record<string, { bid: number; ask: number; change: string }> = {};

    for (const symbol of SYMBOLS) {
      try {
        const quote = await marketData.getLiveQuote(symbol);
        if (quote) {
          prices[symbol] = {
            bid: quote.bid,
            ask: quote.ask,
            change: quote.change,
          };
        }
      } catch (e) {
        // Ignore individual symbol errors
      }
    }

    if (Object.keys(prices).length > 0) {
      const message = JSON.stringify({ type: 'PRICE_UPDATE', data: prices });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }, 1000); // 1-second interval for smooth ticking

  console.log('🌐 WebSocket Price Stream active at ws://localhost:4000/ws/prices');
}