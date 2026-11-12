import { pool } from '../../db/pool.js';
import { tx } from '../../db/tx.js';
import { postEntry } from '../../ledger/post.js';
import { BiquoteProvider } from '../marketdata/biquote.js';

const marketData = new BiquoteProvider();

export async function runMatchingEngine() {
  try {
    // --- 1. CHECK PENDING LIMIT/STOP ORDERS ---
    const pendingResult = await pool.query(`SELECT * FROM orders WHERE status = 'PENDING' AND type IN ('LIMIT', 'STOP')`);
    const pendingOrders = pendingResult.rows;

    for (const order of pendingOrders) {
      const quote = await marketData.getLiveQuote(order.symbol);
      if (!quote) continue;

      const currentPrice = order.side === 'BUY' ? quote.ask : quote.bid;
      const targetPrice = parseFloat(order.price);
      let shouldFill = false;

      if (order.type === 'LIMIT') {
        if (order.side === 'BUY' && currentPrice <= targetPrice) shouldFill = true;
        if (order.side === 'SELL' && currentPrice >= targetPrice) shouldFill = true;
      } else if (order.type === 'STOP') {
        if (order.side === 'BUY' && currentPrice >= targetPrice) shouldFill = true;
        if (order.side === 'SELL' && currentPrice <= targetPrice) shouldFill = true;
      }

      if (shouldFill) {
        await tx(async (db) => {
          await db.query(
            `UPDATE orders SET status = 'FILLED', price = $1 WHERE id = $2`,
            [currentPrice, order.id]
          );
          console.log(`✅ Order Filled: ${order.side} ${order.symbol} at ${currentPrice}`);
        });
      }
    }

    // --- 2. CHECK STOP LOSS / TAKE PROFIT ---
    const filledResult = await pool.query(`SELECT * FROM orders WHERE status = 'FILLED' AND type = 'MARKET'`);
    const filledOrders = filledResult.rows;

    for (const order of filledOrders) {
      if (!order.stop_loss && !order.take_profit) continue; 

      const quote = await marketData.getLiveQuote(order.symbol);
      if (!quote) continue;

      const currentPrice = order.side === 'BUY' ? quote.bid : quote.ask; 
      let shouldClose = false;
      let closeReason = '';

      if (order.stop_loss) {
        const sl = parseFloat(order.stop_loss);
        if (order.side === 'BUY' && currentPrice <= sl) { shouldClose = true; closeReason = 'STOP_LOSS'; }
        if (order.side === 'SELL' && currentPrice >= sl) { shouldClose = true; closeReason = 'STOP_LOSS'; }
      }

      if (order.take_profit && !shouldClose) {
        const tp = parseFloat(order.take_profit);
        if (order.side === 'BUY' && currentPrice >= tp) { shouldClose = true; closeReason = 'TAKE_PROFIT'; }
        if (order.side === 'SELL' && currentPrice <= tp) { shouldClose = true; closeReason = 'TAKE_PROFIT'; }
      }

      if (shouldClose) {
        await closeTrade(order, currentPrice, closeReason);
      }
    }

    // --- 3. MARGIN CALL / STOP OUT ENGINE ---
    // Get all users with FILLED orders
    const usersWithTrades = await pool.query(`SELECT DISTINCT user_id, account_mode FROM orders WHERE status = 'FILLED'`);
    
    for (const row of usersWithTrades.rows) {
      const { user_id, account_mode } = row;
      
      // Get static balance
      const balResult = await pool.query(
        `SELECT balance_minor FROM account_balances WHERE code = $1`,
        [`${account_mode}:USER_AVAILABLE:${user_id}`]
      );
      const balance = Number(balResult.rows[0]?.balance_minor || 0) / 100;

      // Get user's open trades
      const userOrders = await pool.query(
        `SELECT * FROM orders WHERE user_id = $1 AND account_mode = $2 AND status = 'FILLED'`,
        [user_id, account_mode]
      );
      
      let floatingPnl = 0;
      let usedMargin = 0;

      for (const order of userOrders.rows) {
        const quote = await marketData.getLiveQuote(order.symbol);
        if (!quote) continue;

        const openPrice = parseFloat(order.price);
        const volume = parseFloat(order.volume);
        const currentPrice = order.side === 'BUY' ? quote.bid : quote.ask;
        
        const multiplier = 100000 * volume;
        let pnl = order.side === 'BUY' 
          ? (currentPrice - openPrice) * multiplier 
          : (openPrice - currentPrice) * multiplier;
        
        floatingPnl += pnl;
        // Simplified Margin: 1% of trade size (Leverage 1:100)
        usedMargin += (openPrice * volume * 100000) / 100;
      }

      const equity = balance + floatingPnl;
      const marginLevel = usedMargin === 0 ? Infinity : (equity / usedMargin) * 100;

      // If Margin Level drops below 50%, force close the biggest losing trade
      if (marginLevel < 50 && usedMargin > 0) {
        console.log(`🚨 MARGIN CALL for User ${user_id}: Level ${marginLevel.toFixed(2)}%`);
        
        // Find the worst performing trade
        let worstOrder = null;
        let worstPnl = Infinity;

        for (const order of userOrders.rows) {
          const quote = await marketData.getLiveQuote(order.symbol);
          const openPrice = parseFloat(order.price);
          const volume = parseFloat(order.volume);
          const currentPrice = order.side === 'BUY' ? quote.bid : quote.ask;
          const pnl = order.side === 'BUY' ? (currentPrice - openPrice) * 100000 * volume : (openPrice - currentPrice) * 100000 * volume;
          
          if (pnl < worstPnl) {
            worstPnl = pnl;
            worstOrder = order;
          }
        }

        if (worstOrder) {
          const quote = await marketData.getLiveQuote(worstOrder.symbol);
          const closePrice = worstOrder.side === 'BUY' ? quote.bid : quote.ask;
          await closeTrade(worstOrder, closePrice, 'STOP_OUT');
        }
      }
    }

  } catch (error) {
    console.error("Matching Engine Error:", error);
  }
}

// Helper function to close a trade and update the ledger
async function closeTrade(order: any, closePrice: number, reason: string) {
  const volume = parseFloat(order.volume);
  const openPrice = parseFloat(order.price);
  const multiplier = 100000 * volume;
  
  let pnl = order.side === 'BUY' ? (closePrice - openPrice) * multiplier : (openPrice - closePrice) * multiplier;
  pnl = Math.round(pnl * 100) / 100;

  const mode = order.account_mode;

  await tx(async (db) => {
    await db.query(`UPDATE orders SET status = 'CLOSED' WHERE id = $1`, [order.id]);
    
    if (pnl !== 0) {
      const amountMinor = BigInt(Math.abs(pnl) * 100);
      await postEntry(db, {
        txnType: pnl > 0 ? 'TRADE_PROFIT' : 'TRADE_LOSS',
        txnRef: `${reason}-${order.id}`,
        source: 'TRADING',
        destination: `${mode}:USER_AVAILABLE:${order.user_id}`,
        lines: pnl > 0 ? [
          { accountCode: 'ASSET:TRADING_PNL', direction: 'D', amountMinor, currency: 'USD' },
          { accountCode: `${mode}:USER_AVAILABLE:${order.user_id}`, direction: 'C', amountMinor, currency: 'USD' },
        ] : [
          { accountCode: `${mode}:USER_AVAILABLE:${order.user_id}`, direction: 'D', amountMinor, currency: 'USD' },
          { accountCode: 'ASSET:TRADING_PNL', direction: 'C', amountMinor, currency: 'USD' },
        ]
      });
    }
    console.log(`🚨 ${reason} Triggered for ${order.symbol} at ${closePrice}. PnL: ${pnl}`);
  });
}