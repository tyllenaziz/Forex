import { describe, it, expect } from 'vitest';
import { Money } from './Money';

describe('Money', () => {
  it('adds same-currency amounts', () => {
    const a = Money.of(1000n, 'USD');
    const b = Money.of(250n, 'USD');
    expect(a.add(b).amountMinor).toBe(1250n);
  });
  it('rejects currency mismatch', () => {
    expect(() => Money.of(1n, 'USD').add(Money.of(1n, 'EUR'))).toThrow();
  });
});