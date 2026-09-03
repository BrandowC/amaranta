import { Product } from './product.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { ProductCategory } from '../value-objects/product-category.enum';

function buildProduct(stockQuantity: number): Product {
  return Product.reconstitute({
    id: 'p1',
    sku: 'SKU-1',
    name: 'Croquetas',
    description: 'desc',
    category: ProductCategory.FOOD,
    price: Money.cop(10000),
    stockQuantity,
    imageUrl: 'https://example.com/img.png',
    isActive: true,
  });
}

describe('Product', () => {
  it('decrements stock when there is enough', () => {
    const product = buildProduct(10);
    product.decrementStock(3);
    expect(product.stockQuantity).toBe(7);
  });

  it('rejects decrementing below zero (INV-PRODUCT-002)', () => {
    const product = buildProduct(2);
    expect(() => product.decrementStock(5)).toThrow('INV-PRODUCT-002');
  });

  it('restoreStock increases stock back', () => {
    const product = buildProduct(5);
    product.decrementStock(5);
    product.restoreStock(5);
    expect(product.stockQuantity).toBe(5);
  });

  it('hasStockFor reports availability without mutating', () => {
    const product = buildProduct(1);
    expect(product.hasStockFor(2)).toBe(false);
    expect(product.stockQuantity).toBe(1);
  });
});
