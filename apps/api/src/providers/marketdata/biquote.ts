export class BiquoteProvider {
  async getHistoricalCandles(symbol: string, interval: string = '5m', limit: number = 100) {
    // Frankfurter uses standard ISO codes (e.g., EUR and USD)
    const [base, quote] = symbol.split('/');
    
    let basePrice = 1.0850; // Default fallback
    
    try {
      // Fetch REAL live exchange rate from Frankfurter
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${quote}`);
      if (res.ok) {
        const data = await res.json();
        basePrice = data.rates[quote];
      }
    } catch (error) {
      console.error("Frankfurter API failed, using fallback price.");
    }

    // Generate a smooth historical chart ending at the real live price
    const candles = [];
    let time = Math.floor(Date.now() / 1000) - (limit * 300); // 5 min intervals
    let currentPrice = basePrice - (Math.random() * 0.01); // Start slightly lower
    
    for (let i = 0; i < limit; i++) {
      const move = (Math.random() - 0.48) * 0.001; // Slight upward bias
      const close = currentPrice + move;
      const high = Math.max(currentPrice, close) + Math.random() * 0.0005;
      const low = Math.min(currentPrice, close) - Math.random() * 0.0005;
      
      candles.push({
        time: time,
        open: Number(currentPrice.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
      });
      
      currentPrice = close;
      time += 300;
    }

    // Ensure the last candle matches the true live real-world price
    candles[candles.length - 1].close = Number(basePrice.toFixed(5));
    
    return candles;
  }

    async getLiveQuote(symbol: string) {
    // Handle non-fiat symbols with hardcoded base prices (like SparkBinary does for demo)
    const nonFiatDefaults: Record<string, number> = {
      'XAU/USD': 2035.50, 'XAG/USD': 29.40, 'BTC/USD': 67000, 
      'ETH/USD': 3500, 'US30': 39500, 'NAS100': 18000, 'SPX500': 5200
    };

    if (nonFiatDefaults[symbol]) {
      const base = nonFiatDefaults[symbol];
      const tick = (Math.random() - 0.5) * (base * 0.001);
      return {
        symbol, bid: Number((base + tick).toFixed(2)), ask: Number((base + tick + 0.5).toFixed(2)), change: (Math.random() * 1.5 - 0.5).toFixed(2),
      };
    }

    const [base, quote] = symbol.split('/');
    let price = 1.0850;
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${quote}`);
      if (res.ok) {
        const data = await res.json();
        price = data.rates[quote];
      }
    } catch (error) {}

    const tick = (Math.random() - 0.5) * 0.0005;
    const finalBid = price + tick;
    return {
      symbol, bid: Number(finalBid.toFixed(5)), ask: Number((finalBid + 0.0002).toFixed(5)), change: (Math.random() * 1.5 - 0.5).toFixed(2),
    };
  }
}