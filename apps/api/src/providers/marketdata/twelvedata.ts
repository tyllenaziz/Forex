import { env } from '../../config/env.js';

export interface Candle {
  time: number;   // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
}

export class TwelveDataProvider {
  private apiKey = env.TWELVE_DATA_API_KEY;
  private baseUrl = 'https://api.twelvedata.com';

  async getHistoricalCandles(symbol: string, interval: string = '5min', outputsize: number = 100): Promise<Candle[]> {
    if (!this.apiKey) throw new Error('Twelve Data API key is missing');

    // Convert "EUR/USD" to "EUR/USD" (TwelveData accepts this format)
    const url = `${this.baseUrl}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'error') throw new Error(data.message);

    // TwelveData returns newest first, we need oldest first for the chart
    return data.values.reverse().map((v: any) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }));
  }

  async getLiveQuote(symbol: string) {
    if (!this.apiKey) throw new Error('Twelve Data API key is missing');
    
    const url = `${this.baseUrl}/quote?symbol=${symbol}&apikey=${this.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'error') throw new Error(data.message);

    return {
      symbol: data.symbol,
      bid: parseFloat(data.close), // Using close as proxy for bid/ask in free tier
      ask: parseFloat(data.close) + 0.0002,
      change: data.percent_change,
    };
  }
}