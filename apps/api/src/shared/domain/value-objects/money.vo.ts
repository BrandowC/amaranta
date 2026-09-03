import { DomainException } from '../domain-exception';

export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: 'COP',
  ) {}

  static cop(amount: number): Money {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new DomainException('INV-MONEY-001', 'Money amount must be a positive integer');
    }
    return new Money(amount, 'COP');
  }

  static zero(): Money {
    return new Money(0, 'COP');
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount, 'COP');
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, 'COP');
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  format(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(this.amount);
  }
}
