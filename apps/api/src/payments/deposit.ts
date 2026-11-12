import { tx } from '../db/tx.js';
import { SandboxPaymentProvider } from '../providers/payments/sandbox.js';

const provider = new SandboxPaymentProvider();

export async function processDeposit(
  userId: string, 
  amountMinor: bigint, 
  currency: string, 
  accountMode: 'DEMO' | 'REAL' = 'DEMO',
  method: string = 'UNKNOWN',
  details: any = {}
) {
  // 1. Call the external provider (Simulated)
  const intent = await provider.initiateDeposit(userId, amountMinor, currency);
  
  // 2. Save the payment record as PENDING for Admin approval
  return await tx(async (db) => {
    const payment = await db.query(
      `INSERT INTO payment_intents (user_id, kind, status, amount_minor, currency, provider, provider_ref, details, account_mode)
       VALUES ($1, 'DEPOSIT', 'PENDING', $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, amountMinor.toString(), currency, method, intent.providerRef, JSON.stringify(details), accountMode]
    );

    return { paymentId: payment.rows[0].id };
  });
}