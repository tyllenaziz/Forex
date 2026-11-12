import type { PoolClient } from 'pg';
import { PostEntryArgs } from './types.js';

export async function postEntry(db: PoolClient, args: PostEntryArgs) {
  // 1. Enforce double-entry invariant
  const debit = args.lines.filter(l => l.direction === 'D')
    .reduce((s, l) => s + l.amountMinor, 0n);
  const credit = args.lines.filter(l => l.direction === 'C')
    .reduce((s, l) => s + l.amountMinor, 0n);
  if (debit !== credit) throw new Error('Unbalanced journal entry');

  // 2. Idempotent insert
  const entry = await db.query(
    `INSERT INTO journal_entries
      (txn_ref, txn_type, status, source, destination, metadata, idempotency_key)
     VALUES ($1,$2,'POSTED',$3,$4,$5,$6)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING id`,
    [args.txnRef, args.txnType, args.source ?? null, args.destination ?? null,
     JSON.stringify(args.metadata ?? {}), args.idempotencyKey ?? null]
  );
  if (entry.rowCount === 0) return { deduplicated: true };

  const entryId = entry.rows[0].id as string;

  // 3. Post each line
  for (const line of args.lines) {
    const acc = await db.query(
      `INSERT INTO ledger_accounts (code, type, currency)
       VALUES ($1, 'LIABILITY', $2)
       ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code
       RETURNING id`,
      [line.accountCode, line.currency]
    );
    await db.query(
      `INSERT INTO ledger_lines (entry_id, account_id, direction, amount_minor, currency)
       VALUES ($1,$2,$3,$4,$5)`,
      [entryId, acc.rows[0].id, line.direction, line.amountMinor.toString(), line.currency]
    );
  }

  return { entryId };
}