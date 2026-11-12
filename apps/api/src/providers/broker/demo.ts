import { MockMarketDataProvider } from '../marketdata/mock.js';

const marketData = new MockMarketDataProvider();

export class DemoBroker {
  async executeMarketOrder(symbol: string, side: 'BUY' | 'SELL', volume: number) {
    const quote = await marketData.getQuote(symbol);
    
    // In a real broker, you send the order and wait for a fill.
    // Here, we instantly fill it at the current Bid (for sells) or Ask (for buys)
    const executionPrice = side === 'BUY' ? quote.ask : quote.bid;
    
    return {
      status: 'FILLED',
      externalRef: `demo_fill_${crypto.randomUUID()}`,
      executionPrice,
      symbol,
      side,
      volume,
      timestamp: new Date(),
    };
  }
}