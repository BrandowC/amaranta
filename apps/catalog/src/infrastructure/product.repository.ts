import { DataSource } from 'typeorm';
import { ProductQueryPort, ProductSnapshot } from '../domain/product-query.port';

export class ProductRepository implements ProductQueryPort {
  constructor(private readonly db: DataSource) {}

  async findActive(page: number, pageSize: number) {
    return this.db.transaction('REPEATABLE READ', async (manager) => {
      const items: ProductSnapshot[] = await manager.query(
        `SELECT id, sku, name, description, category, price_amount AS price,
                stock_quantity AS "stockQuantity", image_url AS "imageUrl"
         FROM catalog.products WHERE is_active = true
         ORDER BY name, id LIMIT $1 OFFSET $2`,
        [pageSize, (page - 1) * pageSize],
      );
      const [count]: { total: number }[] = await manager.query(
        'SELECT count(*)::int AS total FROM catalog.products WHERE is_active = true',
      );
      return { items, total: count.total };
    });
  }
}
