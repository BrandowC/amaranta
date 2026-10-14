package co.amaranta.sales;

import java.util.List;

public interface CatalogClient {
    List<ReservedStockLine> reserve(String correlationId, List<StockItem> items);

    void release(String correlationId, List<StockItem> items);
}
