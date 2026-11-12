import { pool } from '../db/pool.js';

export async function getBalance(accountCode: string): Promise<bigint> {
  const r = await pool.query(
    `SELECT balance_minor FROM account_balances WHERE code = $1`,
    [accountCode]
  );
  return r.rows[0] ? BigInt(r.rows[0].balance_minor) : 0n;
}