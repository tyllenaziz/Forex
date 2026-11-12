import { z } from 'zod';

export const LedgerLineSchema = z.object({
  accountCode: z.string().min(1),
  direction: z.enum(['D', 'C']),
  amountMinor: z.string().regex(/^\d+$/), // bigint as string over the wire
  currency: z.string().length(3),
});
export type LedgerLine = z.infer<typeof LedgerLineSchema>;

export const PostEntrySchema = z.object({
  txnType: z.string().min(1),
  txnRef: z.string().min(1),
  source: z.string().optional(),
  destination: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  idempotencyKey: z.string().optional(),
  lines: z.array(LedgerLineSchema).min(2),
});
export type PostEntryInput = z.infer<typeof PostEntrySchema>;