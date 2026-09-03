/**
 * Driven port — what Sales needs from Catalog, without knowing how it is reached.
 * Today: an in-process adapter calling Catalog's ReserveStockUseCase directly.
 * After extraction: a REST adapter calling `catalog-service` (see 02-domain/domain-map.md
 * — "Sales D<-U Catalog, REST sync, validate price/stock at checkout").
 */
export const PRODUCT_STOCK_PORT = Symbol('PRODUCT_STOCK_PORT');

export interface StockItemRequest {
  productId: string;
  quantity: number;
}

export interface ReservedStockLine {
  productId: string;
  productName: string;
  unitPriceAmount: number;
  quantity: number;
}

export interface ProductStockPort {
  reserve(items: StockItemRequest[]): Promise<ReservedStockLine[]>;
}
