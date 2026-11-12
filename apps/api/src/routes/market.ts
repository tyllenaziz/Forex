import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { BiquoteProvider } from '../providers/marketdata/biquote.js';

export const marketRouter = Router();
const provider = new BiquoteProvider();

marketRouter.get('/candles/:symbol', authRequired, async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const candles = await provider.getHistoricalCandles(symbol);
    res.json({ candles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

marketRouter.get('/quote/:symbol', authRequired, async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const quote = await provider.getLiveQuote(symbol);
    res.json({ quote });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});