import { Product } from '../../domain/entities/product.entity';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { ProductOrmEntity } from './product.orm-entity';

export class ProductMapper {
  static toDomain(row: ProductOrmEntity): Product {
    return Product.reconstitute({
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      category: row.category,
      price: Money.cop(row.priceAmount),
      stockQuantity: row.stockQuantity,
      imageUrl: row.imageUrl,
      isActive: row.isActive,
    });
  }

  static toPersistence(product: Product): ProductOrmEntity {
    const row = new ProductOrmEntity();
    row.id = product.id;
    row.sku = product.sku;
    row.name = product.name;
    row.description = product.description;
    row.category = product.category;
    row.priceAmount = product.price.amount;
    row.stockQuantity = product.stockQuantity;
    row.imageUrl = product.imageUrl;
    row.isActive = product.isActive;
    return row;
  }
}
