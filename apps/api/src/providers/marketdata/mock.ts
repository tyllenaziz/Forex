export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

export class MockMarketDataProvider {
  // Simulates live price feed
  async getQuote(symbol: string): Promise<Quote> {
    const basePrice = symbol === 'EUR/USD' ? 1.0850 : 1.2650;
    const spread = 0.0002; // 2 pips
    
    // Add small random fluctuation to simulate live market
    const fluctuation = (Math.random() - 0.5) * 0.0010; 
    const currentPrice = basePrice + fluctuation;

    return {
      symbol,
      bid: Number((currentPrice - spread / 2).toFixed(5)),
      ask: Number((currentPrice + spread / 2).toFixed(5)),
      timestamp: Date.now(),
    };
  }
}