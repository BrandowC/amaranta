package co.amaranta.sales;

public record ReservedStockLine(
        String productId,
        String productName,
        int unitPriceAmount,
        int quantity
) {}
