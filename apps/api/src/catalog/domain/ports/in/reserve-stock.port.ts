/**
 * Driving port exposed by Catalog for other contexts (Sales, in-process today).
 * In the target microservices architecture this becomes the REST contract
 * `POST /internal/products/reserve-stock` called by sales-service, or the
 * StockReserved/StockDepleted async events (see 02-domain/domain-events.md).
 */
export interface ReserveStockItem {
  productId: string;
  quantity: number;
}

export interface ReservedLine {
  productId: string;
  productName: string;
  unitPriceAmount: number;
  quantity: number;
}

export interface ReserveStockCommand {
  items: ReserveStockItem[];
}

export interface ReserveStockUseCasePort {
  execute(command: ReserveStockCommand): Promise<ReservedLine[]>;
}
