import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../domain/ports/out/product-repository.port';
import { ReservedLine, ReserveStockCommand, ReserveStockUseCasePort } from '../domain/ports/in/reserve-stock.port';

@Injectable()
export class ReserveStockUseCase implements ReserveStockUseCasePort {
  constructor(@Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepository: ProductRepositoryPort) {}

  async execute(command: ReserveStockCommand): Promise<ReservedLine[]> {
    if (command.items.length === 0) {
      throw new DomainException('INV-ORDER-004', 'an order must have at least one item');
    }

    const products = await this.productRepository.findByIds(command.items.map((item) => item.productId));
    const byId = new Map(products.map((product) => [product.id, product]));

    for (const item of command.items) {
      const product = byId.get(item.productId);
      if (!product || !product.isActive) {
        throw new DomainException('PRODUCT_NOT_FOUND', `Product ${item.productId} does not exist or is inactive`);
      }
      if (!product.hasStockFor(item.quantity)) {
        throw new DomainException(
          'INV-PRODUCT-002',
          `"${product.name}" only has ${product.stockQuantity} unit(s) left (requested ${item.quantity})`,
        );
      }
    }

    const reservedLines: ReservedLine[] = command.items.map((item) => {
      const product = byId.get(item.productId)!;
      product.decrementStock(item.quantity);
      return {
        productId: product.id,
        productName: product.name,
        unitPriceAmount: product.price.amount,
        quantity: item.quantity,
      };
    });

    await this.productRepository.saveMany(Array.from(byId.values()));

    return reservedLines;
  }
}
