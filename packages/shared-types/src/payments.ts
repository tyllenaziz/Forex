import { z } from 'zod';

export const DepositRequestSchema = z.object({
  amountMinor: z.string().regex(/^\d+$/),
  currency: z.string().length(3),
  method: z.string(),
});
export type DepositRequestInput = z.infer<typeof DepositRequestSchema>;

export const WithdrawalRequestSchema = DepositRequestSchema;
export type WithdrawalRequestInput = z.infer<typeof WithdrawalRequestSchema>;