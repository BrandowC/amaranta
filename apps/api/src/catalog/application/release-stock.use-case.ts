import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../domain/ports/out/product-repository.port';
import { ReleaseStockCommand, ReleaseStockUseCasePort } from '../domain/ports/in/release-stock.port';

@Injectable()
export class ReleaseStockUseCase implements ReleaseStockUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(command: ReleaseStockCommand): Promise<void> {
    await Promise.all(command.items.map((item) => this.productRepository.incrementStock(item.productId, item.quantity)));
  }
}
