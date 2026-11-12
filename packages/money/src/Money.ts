// All amounts are bigint minor units (e.g. cents). Never float.
export type Currency = string; // ISO 4217, e.g. 'USD'

export class Money {
  private constructor(
    public readonly amountMinor: bigint,
    public readonly currency: Currency
  ) {}

  static of(amountMinor: bigint | number | string, currency: Currency): Money {
    return new Money(BigInt(amountMinor), currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  sub(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  isZero(): boolean { return this.amountMinor === 0n; }
  isPositive(): boolean { return this.amountMinor > 0n; }

  private assertSameCurrency(o: Money) {
    if (o.currency !== this.currency)
      throw new Error(`Currency mismatch: ${this.currency} vs ${o.currency}`);
  }
}