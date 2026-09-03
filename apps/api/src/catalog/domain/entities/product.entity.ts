import { DomainException } from '../../../shared/domain/domain-exception';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { ProductCategory } from '../value-objects/product-category.enum';

export interface ProductProps {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: Money;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
}

/**
 * Aggregate Root — Catalog bounded context.
 */
export class Product {
  private constructor(private props: ProductProps) {}

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): ProductCategory {
    return this.props.category;
  }

  get price(): Money {
    return this.props.price;
  }

  get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  get imageUrl(): string {
    return this.props.imageUrl;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  hasStockFor(quantity: number): boolean {
    return this.props.stockQuantity >= quantity;
  }

  /** INV-PRODUCT-002: stock must never go below zero. */
  decrementStock(quantity: number): void {
    if (quantity <= 0) {
      throw new DomainException('INV-PRODUCT-003', 'quantity to decrement must be positive');
    }
    if (!this.hasStockFor(quantity)) {
      throw new DomainException(
        'INV-PRODUCT-002',
        `Not enough stock for "${this.props.name}": requested ${quantity}, available ${this.props.stockQuantity}`,
      );
    }
    this.props.stockQuantity -= quantity;
  }

  restoreStock(quantity: number): void {
    this.props.stockQuantity += quantity;
  }
}
