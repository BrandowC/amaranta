import { Injectable } from '@nestjs/common';
import { ProductStockPort, ReservedStockLine, StockItemRequest } from '../../domain/ports/out/product-stock.port';
import { ReserveStockUseCase } from '../../../catalog/application/reserve-stock.use-case';
import { ReleaseStockUseCase } from '../../../catalog/application/release-stock.use-case';

/**
 * Secondary adapter — implements what Sales needs from Catalog by calling
 * Catalog's own driving ports in-process. Replace with an HttpProductStockAdapter
 * (REST to `catalog-service`) when Sales is extracted into its own service;
 * nothing in `domain/` or `application/` would need to change.
 */
@Injectable()
export class CatalogStockAdapter implements ProductStockPort {
  constructor(
    private readonly reserveStock: ReserveStockUseCase,
    private readonly releaseStock: ReleaseStockUseCase,
  ) {}

  async reserve(items: StockItemRequest[]): Promise<ReservedStockLine[]> {
    const reserved = await this.reserveStock.execute({ items });
    return reserved.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      unitPriceAmount: line.unitPriceAmount,
      quantity: line.quantity,
    }));
  }

  async release(items: StockItemRequest[]): Promise<void> {
    await this.releaseStock.execute({ items });
  }
}
