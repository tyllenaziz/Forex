import { pool } from '../../db/pool.js';
import { tx } from '../../db/tx.js';
import { postEntry } from '../../ledger/post.js';
import { BiquoteProvider } from '../marketdata/biquote.js';

const marketData = new BiquoteProvider();

export async function runBinaryEngine() {
  try {
    // 1. Find expired Binary contracts
    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE status = 'PENDING' AND type = 'BINARY' 
       AND created_at + (duration_seconds * interval '1 second') <= NOW()`
    );
    
    const expiredOrders = result.rows;

    for (const order of expiredOrders) {
      // 2. Fetch current price
      const quote = await marketData.getLiveQuote(order.symbol);
      if (!quote) continue;

      // 3. Check win/loss against the entry price
      const entryPrice = parseFloat(order.price);
      const currentPrice = quote.bid;
      
      let isWin = false;
      if (order.side === 'BUY' && currentPrice > entryPrice) isWin = true; // CALL / UP
      if (order.side === 'SELL' && currentPrice < entryPrice) isWin = true; // PUT / DOWN

      // 4. Settle
      await tx(async (db) => {
        const payoutMultiplier = 1.85; // 85% payout
        const stake = Number(order.volume);
        const payout = isWin ? stake * payoutMultiplier : 0;

        await db.query(
          `UPDATE orders SET status = $1, price = $2 WHERE id = $3`,
          [isWin ? 'WON' : 'LOST', currentPrice, order.id]
        );

        if (isWin) {
          const amountMinor = BigInt(Math.round(payout * 100));
          await postEntry(db, {
            txnType: 'BINARY_WIN',
            txnRef: `BINARY-${order.id}`,
            source: 'BINARY_ENGINE',
            destination: `${order.account_mode}:USER_AVAILABLE:${order.user_id}`,
            lines: [
              { accountCode: 'ASSET:TRADING_PNL', direction: 'D', amountMinor, currency: 'USD' },
              { accountCode: `${order.account_mode}:USER_AVAILABLE:${order.user_id}`, direction: 'C', amountMinor, currency: 'USD' },
            ]
          });
        }
        console.log(`Binary Trade ${isWin ? 'WON' : 'LOST'}! ${order.symbol} - Entry: ${entryPrice}, Exit: ${currentPrice}`);
      });
    }
  } catch (error) {
    console.error("Binary Engine Error:", error);
  }
}