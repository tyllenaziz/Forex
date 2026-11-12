import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { tx } from '../db/tx.js';
import { pool } from '../db/pool.js';
import { postEntry } from '../ledger/post.js';

export const adminRouter = Router();

// Middleware to check if the user is an Admin
const adminOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'FINANCE') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// 1. Get all users
adminRouter.get('/users', authRequired, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, full_name, email, phone, country, kyc_status, role, created_at FROM users ORDER BY created_at DESC`);
    res.json({ users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Approve a Real Deposit (Manually credit funds)
adminRouter.post('/deposit', authRequired, adminOnly, async (req, res) => {
  const { userId, amount, currency } = req.body;
  
  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit details' });
  }

  try {
    const amountMinor = BigInt(Math.round(amount * 100)); 

    await tx(async (db) => {
      // 1. Verify the user exists
      const userRes = await db.query(`SELECT id, full_name FROM users WHERE id = $1`, [userId]);
      if (userRes.rows.length === 0) throw new Error('User not found');

      // 2. Get the EXACT account code for this user (handles both "REAL:" prefix and legacy accounts)
      const accountRes = await db.query(
        `SELECT code FROM ledger_accounts 
         WHERE user_id = $1 AND code LIKE '%USER_AVAILABLE%' 
         ORDER BY code DESC LIMIT 1`,
        [userId]
      );
      
      if (accountRes.rows.length === 0) {
        throw new Error('No available account found for this user');
      }

      const accountCode = accountRes.rows[0].code;
      
      // Ensure it's a REAL account (not DEMO)
      // If the account is a DEMO account, we prefix with REAL
      const finalCode = accountCode.startsWith('DEMO:') 
        ? accountCode.replace('DEMO:', 'REAL:') 
        : (accountCode.startsWith('REAL:') ? accountCode : `REAL:${accountCode}`);

      console.log(`✅ Admin crediting $${amount} to ${finalCode} for user ${userRes.rows[0].full_name}`);

      await postEntry(db, {
        txnType: 'ADMIN_DEPOSIT',
        txnRef: `ADMIN-DEP-${Date.now()}`,
        source: 'ADMIN_PANEL',
        destination: finalCode,
        lines: [
          { accountCode: 'ASSET:COMPANY_BANK', direction: 'D', amountMinor, currency: currency || 'USD' },
          { accountCode: finalCode, direction: 'C', amountMinor, currency: currency || 'USD' },
        ]
      });
    });

    res.json({ message: 'Deposit approved and credited successfully' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// 3. Get Pending Withdrawals (For Admin to review)
// 3. Get Pending Withdrawals
adminRouter.get('/withdrawals', authRequired, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.amount_minor, p.currency, p.provider, p.details, p.created_at, u.full_name, u.email
       FROM payment_intents p
       JOIN users u ON u.id = p.user_id
       WHERE p.kind = 'WITHDRAWAL' AND p.status = 'PENDING'
       ORDER BY p.created_at DESC`
    );
    res.json({ withdrawals: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Approve Withdrawal
adminRouter.post('/approve-withdrawal/:id', authRequired, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const intentResult = await pool.query(`SELECT * FROM payment_intents WHERE id = $1`, [id]);
    const intent = intentResult.rows[0];

    if (!intent || intent.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or already processed withdrawal' });
    }

    await tx(async (db) => {
      // Mark as confirmed
      await db.query(`UPDATE payment_intents SET status = 'CONFIRMED' WHERE id = $1`, [id]);
      // Note: The actual funds were already deducted from the user's balance when they requested the withdrawal.
      // So we don't need to touch the ledger here, we just mark the payout as successful.
    });

    res.json({ message: 'Withdrawal approved and paid out.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Reject Withdrawal (Refund the user)
adminRouter.post('/reject-withdrawal/:id', authRequired, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const intentResult = await pool.query(`SELECT * FROM payment_intents WHERE id = $1`, [id]);
    const intent = intentResult.rows[0];

    if (!intent || intent.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or already processed withdrawal' });
    }

    const userId = intent.user_id;
    const amountMinor = BigInt(intent.amount_minor);

    await tx(async (db) => {
      // 1. Mark as rejected
      await db.query(`UPDATE payment_intents SET status = 'REJECTED' WHERE id = $1`, [id]);
      
      // 2. Refund the funds back to the user's REAL account
      await postEntry(db, {
        txnType: 'WITHDRAWAL_REJECTED',
        txnRef: `REJ-WD-${Date.now()}`,
        source: 'ADMIN_PANEL',
        destination: `REAL:USER_AVAILABLE:${userId}`,
        lines: [
          { accountCode: 'ASSET:PSP_RECEIVABLE', direction: 'D', amountMinor, currency: 'USD' },
          { accountCode: `REAL:USER_AVAILABLE:${userId}`, direction: 'C', amountMinor, currency: 'USD' },
        ]
      });
    });

    res.json({ message: 'Withdrawal rejected and funds refunded.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// 4. Promote a user to Admin
adminRouter.patch('/users/:id/role', authRequired, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    await pool.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// 5. Get all Pending Deposits
adminRouter.get('/pending-deposits', authRequired, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.amount_minor, p.currency, p.provider, p.details, p.created_at, u.full_name, u.email
       FROM payment_intents p
       JOIN users u ON u.id = p.user_id
       WHERE p.kind = 'DEPOSIT' AND p.status = 'PENDING'
       ORDER BY p.created_at DESC`
    );
    res.json({ deposits: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Approve a Pending Deposit
adminRouter.post('/approve-deposit/:id', authRequired, adminOnly, async (req, res) => {
  const { id } = req.params;
  
  try {
    const intentResult = await pool.query(`SELECT * FROM payment_intents WHERE id = $1`, [id]);
    const intent = intentResult.rows[0];

    if (!intent || intent.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or already processed deposit' });
    }

    const userId = intent.user_id;
    const amountMinor = BigInt(intent.amount_minor);

    await tx(async (db) => {
      // 1. Update the payment intent
      await db.query(`UPDATE payment_intents SET status = 'CONFIRMED' WHERE id = $1`, [id]);

      // 2. Post to the ledger (Credit the user)
      await postEntry(db, {
        txnType: 'DEPOSIT',
        txnRef: intent.provider_ref,
        source: intent.provider,
        destination: `REAL:USER_AVAILABLE:${userId}`,
        lines: [
          { accountCode: 'ASSET:PSP_RECEIVABLE', direction: 'D', amountMinor, currency: 'USD' },
          { accountCode: `REAL:USER_AVAILABLE:${userId}`, direction: 'C', amountMinor, currency: 'USD' },
        ]
      });
    });

    res.json({ message: 'Deposit approved and funds credited.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// 7. Reject a Pending Deposit
adminRouter.post('/reject-deposit/:id', authRequired, adminOnly, async (req, res) => {
  const { id } = req.params;
  
  try {
    const intentResult = await pool.query(`SELECT * FROM payment_intents WHERE id = $1`, [id]);
    const intent = intentResult.rows[0];

    if (!intent || intent.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or already processed deposit' });
    }

    await pool.query(`UPDATE payment_intents SET status = 'REJECTED' WHERE id = $1`, [id]);

    res.json({ message: 'Deposit rejected.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// 8. Get Admin Stats
adminRouter.get('/stats', authRequired, adminOnly, async (req, res) => {
  try {
    const users = await pool.query(`SELECT COUNT(*) FROM users`);
    
    // Total Deposits (Approved only)
    const deposits = await pool.query(
      `SELECT COALESCE(SUM(amount_minor), 0) as total FROM payment_intents WHERE kind = 'DEPOSIT' AND status = 'CONFIRMED'`
    );

    // Pending Withdrawals
    const withdrawals = await pool.query(
      `SELECT COUNT(*) FROM payment_intents WHERE kind = 'WITHDRAWAL' AND status = 'PENDING'`
    );

    // Open Trades
    const openTrades = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE status = 'FILLED'`
    );

    res.json({
      totalUsers: Number(users.rows[0].count),
      totalDeposits: Number(deposits.rows[0].total) / 100, // convert to dollars
      pendingWithdrawals: Number(withdrawals.rows[0].count),
      openTrades: Number(openTrades.rows[0].count),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
adminRouter.patch('/users/:id/role', authRequired, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['SUPER_ADMIN', 'FINANCE', 'COMPLIANCE', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    await pool.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});