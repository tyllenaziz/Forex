import { PaymentProvider, PaymentIntent } from './types.js';
import crypto from 'node:crypto';

export class SandboxPaymentProvider implements PaymentProvider {
  id = 'sandbox';

  async initiateDeposit(userId: string, amountMinor: bigint, currency: string): Promise<PaymentIntent> {
    // Simulate an external payment gateway confirming the payment
    return {
      providerRef: `sbx_dep_${crypto.randomUUID()}`,
      status: 'CONFIRMED', 
    };
  }
}