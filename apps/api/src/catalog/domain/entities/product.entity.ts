import { randomUUID } from 'crypto';
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

  static create(input: {
    sku: string;
    name: string;
    description: string;
    category: ProductCategory;
    price: Money;
    stockQuantity: number;
    imageUrl: string;
  }): Product {
    if (input.sku.trim().length < 2 || input.sku.trim().length > 50) {
      throw new DomainException('INV-PRODUCT-004', 'sku must be between 2 and 50 characters');
    }
    if (input.name.trim().length < 1 || input.name.trim().length > 120) {
      throw new DomainException('INV-PRODUCT-005', 'name must be between 1 and 120 characters');
    }
    if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) {
      throw new DomainException('INV-PRODUCT-006', 'stockQuantity must be a non-negative integer');
    }
    return new Product({
      id: randomUUID(),
      sku: input.sku.trim(),
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category,
      price: input.price,
      stockQuantity: input.stockQuantity,
      imageUrl: input.imageUrl,
      isActive: true,
    });
  }

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

  updateDetails(input: {
    name?: string;
    description?: string;
    category?: ProductCategory;
    price?: Money;
    imageUrl?: string;
  }): void {
    if (input.name !== undefined) {
      if (input.name.trim().length < 1 || input.name.trim().length > 120) {
        throw new DomainException('INV-PRODUCT-005', 'name must be between 1 and 120 characters');
      }
      this.props.name = input.name.trim();
    }
    if (input.description !== undefined) this.props.description = input.description.trim();
    if (input.category !== undefined) this.props.category = input.category;
    if (input.price !== undefined) this.props.price = input.price;
    if (input.imageUrl !== undefined) this.props.imageUrl = input.imageUrl;
  }

  /** INV-PRODUCT-006: stock must never be set to a negative value. */
  setStockQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainException('INV-PRODUCT-006', 'stockQuantity must be a non-negative integer');
    }
    this.props.stockQuantity = quantity;
  }

  activate(): void {
    this.props.isActive = true;
  }

  deactivate(): void {
    this.props.isActive = false;
  }
}
