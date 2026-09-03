import { Inject, Injectable } from '@nestjs/common';
import {
  ListProductsQuery,
  ListProductsResult,
  ListProductsUseCasePort,
  ProductSummary,
} from '../domain/ports/in/list-products.port';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../domain/ports/out/product-repository.port';
import { Product } from '../domain/entities/product.entity';

const MAX_PAGE_SIZE = 50;

@Injectable()
export class ListProductsUseCase implements ListProductsUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(query: ListProductsQuery): Promise<ListProductsResult> {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize || MAX_PAGE_SIZE));

    const result = await this.productRepository.findActivePaginated(page, pageSize);

    return {
      items: result.items.map(toSummary),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
  }
}

function toSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price.amount,
    priceFormatted: product.price.format(),
    stockQuantity: product.stockQuantity,
    inStock: product.stockQuantity > 0,
    imageUrl: product.imageUrl,
  };
}
