export interface LedgerLineInput {
  accountCode: string;
  direction: 'D' | 'C';
  amountMinor: bigint;
  currency: string;
}

export interface PostEntryArgs {
  txnType: string;
  txnRef: string;
  source?: string;
  destination?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
  lines: LedgerLineInput[];
}