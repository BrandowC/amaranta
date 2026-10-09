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
      // This is an early, non-authoritative check on a snapshot that may already be stale by
      // the time we write — it exists only to fail fast on an obviously-empty product before
      // touching the database. The real, race-safe check is the atomic decrement below.
      if (!product.hasStockFor(item.quantity)) {
        throw new DomainException(
          'INV-PRODUCT-002',
          `"${product.name}" only has ${product.stockQuantity} unit(s) left (requested ${item.quantity})`,
        );
      }
    }

    // Reserve one item at a time via a single atomic conditional UPDATE per product — never a
    // read-then-decrement-then-write. Two concurrent requests for the same last unit now both
    // race the SAME `WHERE stock_quantity >= qty` write; the database allows only one to affect
    // a row (see `reserve-stock.concurrency.spec.ts`, and `sales-api-decisions.md` reference to
    // this fix). Anything reserved before a later item fails is compensated (released back).
    const reserved: { productId: string; quantity: number }[] = [];
    try {
      for (const item of command.items) {
        const ok = await this.productRepository.tryDecrementStock(item.productId, item.quantity);
        if (!ok) {
          const product = byId.get(item.productId)!;
          const current = await this.productRepository.findById(item.productId);
          throw new DomainException(
            'INV-PRODUCT-002',
            `"${product.name}" only has ${current?.stockQuantity ?? 0} unit(s) left (requested ${item.quantity})`,
          );
        }
        reserved.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (error) {
      await Promise.all(reserved.map((line) => this.productRepository.incrementStock(line.productId, line.quantity)));
      throw error;
    }

    return command.items.map((item) => {
      const product = byId.get(item.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        unitPriceAmount: product.price.amount,
        quantity: item.quantity,
      };
    });
  }
}
