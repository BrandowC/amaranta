import { ProductQueryPort } from '../domain/product-query.port';

export class ListProducts {
  constructor(private readonly products: ProductQueryPort) {}

  async execute(page = 1, pageSize = 50) {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 1000000 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50
    ) {
      throw new RangeError('Invalid pagination');
    }
    const result = await this.products.findActive(page, pageSize);
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
    return {
      items: result.items.map((product) => ({
        ...product,
        priceFormatted: formatter.format(product.price),
        inStock: product.stockQuantity > 0,
      })),
      page,
      pageSize,
      total: result.total,
    };
  }
}
