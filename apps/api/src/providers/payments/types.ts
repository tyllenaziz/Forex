export interface PaymentIntent {
  providerRef: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  checkoutUrl?: string;
}

export interface PaymentProvider {
  id: string;
  initiateDeposit(userId: string, amountMinor: bigint, currency: string): Promise<PaymentIntent>;
}