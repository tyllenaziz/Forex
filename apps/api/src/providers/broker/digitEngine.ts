import { pool } from '../../db/pool.js';
import { tx } from '../../db/tx.js';
import { postEntry } from '../../ledger/post.js';
import { BiquoteProvider } from '../marketdata/biquote.js';

const marketData = new BiquoteProvider();

export async function runDigitEngine() {
  try {
    // 1. Get all PENDING digit contracts that have expired
    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE status = 'PENDING' AND type = 'DIGIT' 
       AND created_at + (duration_seconds * interval '1 second') <= NOW()`
    );
    
    const expiredOrders = result.rows;

    for (const order of expiredOrders) {
      // 2. Fetch current price to get the last digit
      const quote = await marketData.getLiveQuote(order.symbol);
      if (!quote) continue;

      // Get the last digit of the price (e.g., 1.1224 -> 4)
      const priceString = quote.bid.toString();
      const lastDigit = parseInt(priceString[priceString.length - 1]);

      let isWin = false;
      const prediction = order.digit_prediction;

      // 3. Check if they won
      if (prediction === 'EVEN' && lastDigit % 2 === 0) isWin = true;
      else if (prediction === 'ODD' && lastDigit % 2 !== 0) isWin = true;
      else if (prediction === 'OVER' && lastDigit > 4) isWin = true;
      else if (prediction === 'UNDER' && lastDigit < 5) isWin = true;
      else if (parseInt(prediction) === lastDigit) isWin = true;

      // 4. Settle the trade and check session limits
      const sessionStatus = await tx(async (db) => {
        const payout = isWin ? Number(order.volume) * 1.95 : 0; 
        const mode = order.account_mode; // Use the correct mode (DEMO or REAL)

        // Update order status
        await db.query(
          `UPDATE orders SET status = $1, price = $2 WHERE id = $3`,
          [isWin ? 'WON' : 'LOST', lastDigit, order.id]
        );

        // Credit the account if they won
        if (isWin) {
          const amountMinor = BigInt(Math.round(payout * 100));
          await postEntry(db, {
            txnType: 'DIGIT_WIN',
            txnRef: `DIGIT-${order.id}`,
            source: 'DIGIT_ENGINE',
            destination: `${mode}:USER_AVAILABLE:${order.user_id}`,
            lines: [
              { accountCode: 'ASSET:TRADING_PNL', direction: 'D', amountMinor, currency: 'USD' },
              { accountCode: `${mode}:USER_AVAILABLE:${order.user_id}`, direction: 'C', amountMinor, currency: 'USD' },
            ]
          });
        }
        console.log(`Digit Trade ${isWin ? 'WON' : 'LOST'}! Predicted: ${prediction}, Actual: ${lastDigit}`);

        // --- 5. SESSION RISK CHECK (TP / SL) ---
        // Calculate total session PnL for the last 1 hour
        const sessionPnlResult = await db.query(
          `SELECT SUM(CASE WHEN status = 'WON' THEN volume * 1.95 ELSE -volume END) as session_pnl 
           FROM orders 
           WHERE user_id = $1 AND account_mode = $2 AND type = 'DIGIT' 
           AND status IN ('WON', 'LOST') AND created_at > NOW() - INTERVAL '1 hour'`,
          [order.user_id, mode]
        );
        
        const sessionPnl = Number(sessionPnlResult.rows[0]?.session_pnl || 0);
        const tp = Number(order.session_tp || 0);
        const sl = Number(order.session_sl || 0);

        if (tp > 0 && sessionPnl >= tp) {
          await db.query(`UPDATE users SET trading_paused = true WHERE id = $1`, [order.user_id]);
          return { triggered: 'TP', pnl: sessionPnl };
        }
        if (sl > 0 && sessionPnl <= -sl) {
          await db.query(`UPDATE users SET trading_paused = true WHERE id = $1`, [order.user_id]);
          return { triggered: 'SL', pnl: sessionPnl };
        }

        return { triggered: null, pnl: sessionPnl };
      });

      if (sessionStatus.triggered) {
        console.log(`🛑 Session ${sessionStatus.triggered} hit for user ${order.user_id}. Session PnL: ${sessionStatus.pnl.toFixed(2)}. Trading PAUSED.`);
      }
    }
  } catch (error) {
    console.error("Digit Engine Error:", error);
  }
}