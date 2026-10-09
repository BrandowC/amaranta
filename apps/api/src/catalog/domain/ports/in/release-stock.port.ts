/**
 * Driving port exposed by Catalog for other contexts: the compensation for ReserveStock.
 * In the target microservices architecture this becomes `POST /internal/products/release-stock`
 * or the StockReleased event (see 02-domain/domain-events.md).
 */
export interface ReleaseStockItem {
  productId: string;
  quantity: number;
}

export interface ReleaseStockCommand {
  items: ReleaseStockItem[];
}

export interface ReleaseStockUseCasePort {
  execute(command: ReleaseStockCommand): Promise<void>;
}
