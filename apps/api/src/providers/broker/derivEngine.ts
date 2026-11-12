import { pool } from '../../db/pool.js';
import { tx } from '../../db/tx.js';
import { postEntry } from '../../ledger/post.js';
import { BiquoteProvider } from '../marketdata/biquote.js';

const marketData = new BiquoteProvider();

export async function runDerivEngine() {
  try {
    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE status = 'PENDING' AND type = 'DERIV' 
       AND created_at + (duration_seconds * interval '1 second') <= NOW()`
    );
    
    const expiredOrders = result.rows;

    for (const order of expiredOrders) {
      const quote = await marketData.getLiveQuote(order.symbol);
      if (!quote) continue;

      const entryPrice = parseFloat(order.price);
      const currentPrice = quote.bid;
      
      let isWin = false;
      if (order.side === 'BUY' && currentPrice > entryPrice) isWin = true; // RISE
      if (order.side === 'SELL' && currentPrice < entryPrice) isWin = true; // FALL

      const mode = order.account_mode;

      await tx(async (db) => {
        const payoutMultiplier = 1.95; // 95% payout for Rise/Fall
        const stake = Number(order.volume);
        const payout = isWin ? stake * payoutMultiplier : 0;

        await db.query(
          `UPDATE orders SET status = $1, price = $2 WHERE id = $3`,
          [isWin ? 'WON' : 'LOST', currentPrice, order.id]
        );

        if (isWin) {
          const amountMinor = BigInt(Math.round(payout * 100));
          await postEntry(db, {
            txnType: 'DERIV_WIN',
            txnRef: `DERIV-${order.id}`,
            source: 'DERIV_ENGINE',
            destination: `${mode}:USER_AVAILABLE:${order.user_id}`,
            lines: [
              { accountCode: 'ASSET:TRADING_PNL', direction: 'D', amountMinor, currency: 'USD' },
              { accountCode: `${mode}:USER_AVAILABLE:${order.user_id}`, direction: 'C', amountMinor, currency: 'USD' },
            ]
          });
        }
        console.log(`Deriv Rise/Fall ${isWin ? 'WON' : 'LOST'}! ${order.symbol} - Entry: ${entryPrice}, Exit: ${currentPrice}`);
      });
    }
  } catch (error) {
    console.error("Deriv Engine Error:", error);
  }
}