import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { pool } from '../db/pool.js';

export const walletRouter = Router();

// 1. Get Current Balance
walletRouter.get('/balance', authRequired, async (req, res) => {
  const userId = (req as any).user.sub;
  const mode = req.query.mode === 'REAL' ? 'REAL' : 'DEMO'; 
  
  const result = await pool.query(
    `SELECT code, balance_minor FROM account_balances WHERE code LIKE $1`,
    [`${mode}:USER_%:${userId}`]
  );

  res.json({ balances: result.rows });
});

// 2. Get Transaction History
walletRouter.get('/history', authRequired, async (req, res) => {
  const userId = (req as any).user.sub;
  const mode = req.query.mode === 'REAL' ? 'REAL' : 'DEMO';

  try {
    // We query the journal entries that affected this user's accounts
    const result = await pool.query(
      `SELECT 
        j.id, 
        j.txn_type, 
        j.txn_ref,
        j.created_at,
        SUM(CASE WHEN l.direction = 'C' THEN l.amount_minor ELSE -l.amount_minor END) as amount_minor
       FROM journal_entries j
       JOIN ledger_lines l ON l.entry_id = j.id
       JOIN ledger_accounts a ON l.account_id = a.id
       WHERE a.code LIKE $1
       GROUP BY j.id, j.txn_type, j.txn_ref, j.created_at
       ORDER BY j.created_at DESC
       LIMIT 50`,
      [`${mode}:USER_AVAILABLE:${userId}`]
    );

    res.json({ transactions: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});