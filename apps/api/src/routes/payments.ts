import { Router } from 'express';
import { authRequired } from '../auth/middleware.js';
import { processDeposit } from '../payments/deposit.js';
import { tx } from '../db/tx.js';
import { postEntry } from '../ledger/post.js';
import { pool } from '../db/pool.js';

export const paymentsRouter = Router();

paymentsRouter.post('/deposit', authRequired, async (req, res) => {
  try {
    const userId = (req as any).user.sub;
    const { amount, accountMode, method, details } = req.body; 
    const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const amountMinor = BigInt(Math.floor(amount * 100));
    const result = await processDeposit(userId, amountMinor, 'USD', mode, method, details);
    
    res.status(200).json({ message: 'Deposit request submitted for approval', ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

paymentsRouter.post('/withdraw', authRequired, async (req, res) => {
  try {
    const userId = (req as any).user.sub;
    const { amount, accountMode, method, details } = req.body; 
    const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const amountMinor = BigInt(Math.floor(amount * 100));

    await tx(async (db) => {
      // 1. Check balance
      const balResult = await db.query(
        `SELECT balance_minor FROM account_balances WHERE code = $1`,
        [`${mode}:USER_AVAILABLE:${userId}`]
      );
      const balance = BigInt(balResult.rows[0]?.balance_minor || 0);
      if (balance < amountMinor) throw new Error('Insufficient balance');

      // 2. Deduct from user balance immediately (funds are frozen)
      await postEntry(db, {
        txnType: 'WITHDRAWAL_REQUEST',
        txnRef: `WD-REQ-${Date.now()}`,
        source: 'USER',
        destination: 'ADMIN_APPROVAL',
        lines: [
          { accountCode: `${mode}:USER_AVAILABLE:${userId}`, direction: 'D', amountMinor, currency: 'USD' },
          { accountCode: 'ASSET:PSP_RECEIVABLE', direction: 'C', amountMinor, currency: 'USD' },
        ]
      });

      // 3. Create the pending intent for the admin to review
      await db.query(
        `INSERT INTO payment_intents (user_id, kind, status, amount_minor, currency, provider, details)
         VALUES ($1, 'WITHDRAWAL', 'PENDING', $2, 'USD', $3, $4)`,
        [userId, amountMinor.toString(), method, JSON.stringify(details)]
      );
    });

    res.status(200).json({ message: 'Withdrawal request submitted for approval' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

paymentsRouter.post('/transfer', authRequired, async (req, res) => {
  try {
    const userId = (req as any).user.sub;
    const { amount, accountMode, recipient } = req.body;
    const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // Find recipient
    const recipientResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [recipient]);
    const recipientUser = recipientResult.rows[0];
    
    if (!recipientUser) return res.status(404).json({ error: 'Recipient not found' });
    if (recipientUser.id === userId) return res.status(400).json({ error: 'Cannot transfer to yourself' });

    const amountMinor = BigInt(Math.floor(amount * 100));

    await tx(async (db) => {
      // Debit sender, Credit receiver
      await postEntry(db, {
        txnType: 'TRANSFER_OUT',
        txnRef: `TRF-OUT-${Date.now()}`,
        source: 'USER',
        destination: 'USER',
        lines: [
          { accountCode: `${mode}:USER_AVAILABLE:${userId}`, direction: 'D', amountMinor, currency: 'USD' },
          { accountCode: `${mode}:USER_AVAILABLE:${recipientUser.id}`, direction: 'C', amountMinor, currency: 'USD' },
        ]
      });
    });

    res.status(200).json({ message: 'Transfer successful' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});