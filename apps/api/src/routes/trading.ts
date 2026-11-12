import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { tx } from '../db/tx.js';
import { pool } from '../db/pool.js';
import { DemoBroker } from '../providers/broker/demo.js';
import { PlaceOrderSchema } from '@platform/shared-types';
import { BiquoteProvider } from '../providers/marketdata/biquote.js';
import { postEntry } from '../ledger/post.js';

export const tradingRouter = Router();
const broker = new DemoBroker();

tradingRouter.post('/order', authRequired, async (req, res) => {
  const parsed = PlaceOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

  const { symbol, side, type, volume, price, stopLoss, takeProfit, accountMode } = req.body;
  const userId = (req as any).user.sub;
  const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

  try {
    const result = await tx(async (db) => {
      // 1. Check margin based on account mode
      const balResult = await db.query(
        `SELECT balance_minor FROM account_balances WHERE code = $1`,
        [`${mode}:USER_AVAILABLE:${userId}`]
      );
      const balance = BigInt(balResult.rows[0]?.balance_minor || 0);
      
      // Require a minimum of $10.00 (1000 minor units) to open a trade
      if (balance < 1000n) { 
        throw new Error(`Insufficient ${mode} balance. Minimum required is $10.00.`);
      }

      // 2. Determine execution
      let fillStatus = 'PENDING';
      let executionPrice = price || 0;
      let externalRef = null;

      if (type === 'MARKET') {
        const fill = await broker.executeMarketOrder(symbol, side, volume);
        fillStatus = fill.status; 
        executionPrice = fill.executionPrice;
        externalRef = fill.externalRef;
      }

      // 3. Save the order with the correct account_mode
      const order = await db.query(
        `INSERT INTO orders 
         (user_id, account_mode, symbol, side, type, volume, price, stop_loss, take_profit, status, external_ref)
         VALUES ($1, $11, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, status`,
        [userId, symbol, side, type, volume, executionPrice, stopLoss || null, takeProfit || null, fillStatus, externalRef, mode]
      );

      return { order: order.rows[0], price: executionPrice };
    });

    res.status(200).json({ message: 'Order placed', ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tradingRouter.get('/positions', authRequired, async (req, res) => {
  const userId = (req as any).user.sub;
  const mode = req.query.mode === 'REAL' ? 'REAL' : 'DEMO';

  try {
        const result = await pool.query(
      `SELECT id, symbol, side, type, volume, price, stop_loss, take_profit, status, created_at, digit_prediction, duration_seconds 
       FROM orders 
       WHERE user_id = $1 AND account_mode = $2 AND status IN ('FILLED', 'PENDING', 'WON', 'LOST') 
       ORDER BY created_at DESC`,
      [userId, mode]
    );
    res.json({ positions: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

tradingRouter.post('/close/:id', authRequired, async (req, res) => {
  const orderId = req.params.id;
  const userId = (req as any).user.sub;

  try {
    const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1 AND user_id = $2`, [orderId, userId]);
    const order = orderResult.rows[0];

    if (!order || order.status !== 'FILLED') {
      return res.status(400).json({ error: 'Order not found or not filled' });
    }

    const mode = order.account_mode;

    const marketData = new BiquoteProvider();
    const quote = await marketData.getLiveQuote(order.symbol);
    const closePrice = order.side === 'BUY' ? quote.bid : quote.ask;

    const openPrice = parseFloat(order.price);
    const volume = parseFloat(order.volume);
    const multiplier = 100000 * volume;
    
    let pnl = 0;
    if (order.side === 'BUY') {
      pnl = (closePrice - openPrice) * multiplier;
    } else {
      pnl = (openPrice - closePrice) * multiplier;
    }

    pnl = Math.round(pnl * 100) / 100;

    await tx(async (db) => {
      await db.query(`UPDATE orders SET status = 'CLOSED' WHERE id = $1`, [orderId]);
      
      if (pnl !== 0) {
        const amountMinor = BigInt(Math.abs(pnl) * 100);
        await postEntry(db, {
          txnType: pnl > 0 ? 'TRADE_PROFIT' : 'TRADE_LOSS',
          txnRef: `CLOSE-${orderId}`,
          source: 'TRADING',
          destination: `${mode}:USER_AVAILABLE:${userId}`,
          lines: pnl > 0 ? [
            { accountCode: 'ASSET:TRADING_PNL', direction: 'D', amountMinor, currency: 'USD' },
            { accountCode: `${mode}:USER_AVAILABLE:${userId}`, direction: 'C', amountMinor, currency: 'USD' },
          ] : [
            { accountCode: `${mode}:USER_AVAILABLE:${userId}`, direction: 'D', amountMinor, currency: 'USD' },
            { accountCode: 'ASSET:TRADING_PNL', direction: 'C', amountMinor, currency: 'USD' },
          ]
        });
      }
    });

    res.json({ message: 'Position closed successfully', closePrice, pnl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// FIXED: Only ONE digit route, properly fetching the entry price
tradingRouter.post('/digit', authRequired, async (req, res) => {
  const { symbol, prediction, volume, durationSeconds, accountMode } = req.body;
  const userId = (req as any).user.sub;
  const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

  try {
    const marketData = new BiquoteProvider();
    const quote = await marketData.getLiveQuote(symbol);
    const entryPrice = quote.bid;

    const result = await tx(async (db) => {
      const balResult = await db.query(
        `SELECT balance_minor FROM account_balances WHERE code = $1`,
        [`${mode}:USER_AVAILABLE:${userId}`]
      );
      const balance = BigInt(balResult.rows[0]?.balance_minor || 0);
      const stakeMinor = BigInt(Math.round(volume * 100));

      if (balance < stakeMinor) throw new Error('Insufficient balance');

      await postEntry(db, {
        txnType: 'DIGIT_STAKE',
        txnRef: `DIGIT-STAKE-${Date.now()}`,
        source: 'USER',
        destination: 'DIGIT_ENGINE',
        lines: [
          { accountCode: `${mode}:USER_AVAILABLE:${userId}`, direction: 'D', amountMinor: stakeMinor, currency: 'USD' },
          { accountCode: 'ASSET:TRADING_PNL', direction: 'C', amountMinor: stakeMinor, currency: 'USD' },
        ]
      });

          const { takeProfit, stopLoss } = req.body; // Extract from body

    const order = await db.query(
        `INSERT INTO orders 
         (user_id, account_mode, symbol, side, type, volume, price, status, digit_prediction, duration_seconds, session_tp, session_sl)
         VALUES ($1, $2, $3, 'BUY', 'DIGIT', $4, $5, 'PENDING', $6, $7, $8, $9)
         RETURNING id, status`,
        [userId, mode, symbol, volume, entryPrice, prediction.toString(), durationSeconds, takeProfit || null, stopLoss || null]
      );

      return { order: order.rows[0] };
    });

    res.status(200).json({ message: 'Digit order placed', ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// FIXED: Only ONE binary route, properly fetching the entry price
tradingRouter.post('/binary', authRequired, async (req, res) => {
  const { symbol, direction, amount, duration, accountMode } = req.body;
  const userId = (req as any).user.sub;
  const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

  let durationSeconds = 60;
  if (duration === '30s') durationSeconds = 30;
  else if (duration === '5m') durationSeconds = 300;
  else if (duration === '15m') durationSeconds = 900;

  try {
    const marketData = new BiquoteProvider();
    const quote = await marketData.getLiveQuote(symbol);
    const entryPrice = quote.bid; 

    const result = await tx(async (db) => {
      const balResult = await db.query(
        `SELECT balance_minor FROM account_balances WHERE code = $1`,
        [`${mode}:USER_AVAILABLE:${userId}`]
      );
      const balance = BigInt(balResult.rows[0]?.balance_minor || 0);
      const stakeMinor = BigInt(Math.round(amount * 100));

      if (balance < stakeMinor) throw new Error('Insufficient balance');

      await postEntry(db, {
        txnType: 'BINARY_STAKE',
        txnRef: `BINARY-STAKE-${Date.now()}`,
        source: 'USER',
        destination: 'BINARY_ENGINE',
        lines: [
          { accountCode: `${mode}:USER_AVAILABLE:${userId}`, direction: 'D', amountMinor: stakeMinor, currency: 'USD' },
          { accountCode: 'ASSET:TRADING_PNL', direction: 'C', amountMinor: stakeMinor, currency: 'USD' },
        ]
      });

      const order = await db.query(
        `INSERT INTO orders 
         (user_id, account_mode, symbol, side, type, volume, price, status, duration_seconds)
         VALUES ($1, $2, $3, $4, 'BINARY', $5, $6, 'PENDING', $7)
         RETURNING id, status`,
        [userId, mode, symbol, direction === 'CALL' ? 'BUY' : 'SELL', amount, entryPrice, durationSeconds]
      );

      return { order: order.rows[0] };
    });

    res.status(200).json({ message: 'Binary order placed', ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tradingRouter.get('/account-summary', authRequired, async (req, res) => {
  const userId = (req as any).user.sub;
  const mode = req.query.mode === 'REAL' ? 'REAL' : 'DEMO';

  try {
    // 1. Get static balance
    const balResult = await pool.query(
      `SELECT balance_minor FROM account_balances WHERE code = $1`,
      [`${mode}:USER_AVAILABLE:${userId}`]
    );
    const balance = Number(balResult.rows[0]?.balance_minor || 0) / 100;

    // 2. Get open positions
    const ordersResult = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 AND account_mode = $2 AND status = 'FILLED'`,
      [userId, mode]
    );
    const orders = ordersResult.rows;

    // 3. Calculate floating PnL and used margin
    let floatingPnl = 0;
    let usedMargin = 0;
    const marketData = new BiquoteProvider();

    for (const order of orders) {
      const quote = await marketData.getLiveQuote(order.symbol);
      if (!quote) continue;

      const openPrice = parseFloat(order.price);
      const volume = parseFloat(order.volume);
      const currentPrice = order.side === 'BUY' ? quote.bid : quote.ask;
      
      // PnL Calculation
      const multiplier = 100000 * volume;
      let pnl = order.side === 'BUY' 
        ? (currentPrice - openPrice) * multiplier 
        : (openPrice - currentPrice) * multiplier;
      
      floatingPnl += pnl;

      // Margin Calculation (Simplified: 1% margin requirement = 1:100 leverage)
      usedMargin += (openPrice * volume * 100000) / 100;
    }

    const equity = balance + floatingPnl;
    const freeMargin = Math.max(0, equity - usedMargin);
    const marginLevel = usedMargin === 0 ? 0 : (equity / usedMargin) * 100;

    res.json({
      balance: balance.toFixed(2),
      equity: equity.toFixed(2),
      floatingPnl: floatingPnl.toFixed(2),
      usedMargin: usedMargin.toFixed(2),
      freeMargin: freeMargin.toFixed(2),
      marginLevel: marginLevel.toFixed(2),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
tradingRouter.get('/history', authRequired, async (req, res) => {
  const userId = (req as any).user.sub;
  const mode = req.query.mode === 'REAL' ? 'REAL' : 'DEMO';

  try {
    const result = await pool.query(
      `SELECT id, symbol, side, type, volume, price, status, digit_prediction, created_at 
       FROM orders 
       WHERE user_id = $1 AND account_mode = $2 AND status IN ('CLOSED', 'WON', 'LOST') 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userId, mode]
    );
    res.json({ history: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
tradingRouter.post('/cancel/:id', authRequired, async (req, res) => {
  const orderId = req.params.id;
  const userId = (req as any).user.sub;

  try {
    const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1 AND user_id = $2`, [orderId, userId]);
    const order = orderResult.rows[0];

    // Only PENDING orders can be cancelled
    if (!order || order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Order not found or cannot be cancelled' });
    }

    await tx(async (db) => {
      // 1. Mark the order as CANCELLED
      await db.query(`UPDATE orders SET status = 'CANCELLED' WHERE id = $1`, [orderId]);
      
      // Note: Since we don't lock margin for pending orders yet in this simplified version,
      // we don't need to refund any margin here. The balance was never deducted.
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
tradingRouter.get('/stats', authRequired, async (req, res) => {
  const userId = (req as any).user.sub;
  const mode = req.query.mode === 'REAL' ? 'REAL' : 'DEMO';

  try {
    // 1. Total Trades (All time)
    const totalRes = await pool.query(
      `SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND account_mode = $2 AND status IN ('CLOSED', 'WON', 'LOST')`,
      [userId, mode]
    );
    
    // 2. Won Trades
    const wonRes = await pool.query(
      `SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND account_mode = $2 AND status IN ('WON', 'CLOSED')`,
      [userId, mode]
    );

    // 3. Realized PnL (Sum of all trade profits - losses)
    // We query the ledger for TRADE_PROFIT and TRADE_LOSS entries related to this user
    const pnlRes = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN j.txn_type = 'TRADE_PROFIT' THEN l.amount_minor 
                          WHEN j.txn_type = 'TRADE_LOSS' THEN -l.amount_minor 
                          ELSE 0 END), 0) as total_pnl
       FROM journal_entries j
       JOIN ledger_lines l ON l.entry_id = j.id
       JOIN ledger_accounts a ON l.account_id = a.id
       WHERE a.code = $1`,
      [`${mode}:USER_AVAILABLE:${userId}`]
    );

    // 4. Open Trades
    const openRes = await pool.query(
      `SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND account_mode = $2 AND status = 'FILLED'`,
      [userId, mode]
    );

    // 5. Recent Trades
    const recentRes = await pool.query(
      `SELECT id, symbol, side, type, volume, price, status, created_at FROM orders 
       WHERE user_id = $1 AND account_mode = $2 AND status IN ('CLOSED', 'WON', 'LOST') 
       ORDER BY created_at DESC LIMIT 5`,
      [userId, mode]
    );

    const total = Number(totalRes.rows[0].count);
    const won = Number(wonRes.rows[0].count);
    const winRate = total === 0 ? 0 : (won / total) * 100;
    const totalPnl = Number(pnlRes.rows[0].total_pnl) / 100;

    res.json({
      totalTrades: total,
      winRate: winRate.toFixed(1),
      totalPnl: totalPnl.toFixed(2),
      openTrades: Number(openRes.rows[0].count),
      recentTrades: recentRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// Rise/Fall Trade Route
tradingRouter.post('/deriv', authRequired, async (req, res) => {
  const { symbol, direction, amount, duration, accountMode } = req.body;
  const userId = (req as any).user.sub;
  const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

  let durationSeconds = 60;
  if (duration === '30s') durationSeconds = 30;
  else if (duration === '5m') durationSeconds = 300;
  else if (duration === '15m') durationSeconds = 900;

  try {
    const marketData = new BiquoteProvider();
    const quote = await marketData.getLiveQuote(symbol);
    const entryPrice = quote.bid; 

    const result = await tx(async (db) => {
      const balResult = await db.query(
        `SELECT balance_minor FROM account_balances WHERE code = $1`,
        [`${mode}:USER_AVAILABLE:${userId}`]
      );
      const balance = BigInt(balResult.rows[0]?.balance_minor || 0);
      const stakeMinor = BigInt(Math.round(amount * 100));

      if (balance < stakeMinor) throw new Error('Insufficient balance');

      await postEntry(db, {
        txnType: 'DERIV_STAKE',
        txnRef: `DERIV-STAKE-${Date.now()}`,
        source: 'USER',
        destination: 'DERIV_ENGINE',
        lines: [
          { accountCode: `${mode}:USER_AVAILABLE:${userId}`, direction: 'D', amountMinor: stakeMinor, currency: 'USD' },
          { accountCode: 'ASSET:TRADING_PNL', direction: 'C', amountMinor: stakeMinor, currency: 'USD' },
        ]
      });

      const order = await db.query(
        `INSERT INTO orders 
         (user_id, account_mode, symbol, side, type, volume, price, status, duration_seconds)
         VALUES ($1, $2, $3, $4, 'DERIV', $5, $6, 'PENDING', $7)
         RETURNING id, status`,
        [userId, mode, symbol, direction === 'RISE' ? 'BUY' : 'SELL', amount, entryPrice, durationSeconds]
      );

      return { order: order.rows[0] };
    });

    res.status(200).json({ message: 'Rise/Fall order placed', ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});