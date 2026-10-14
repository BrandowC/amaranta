package co.amaranta.sales;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class HttpCatalogClient implements CatalogClient {
    private final HttpClient httpClient;
    private final URI catalogBaseUri;
    private final ObjectMapper objectMapper;

    public HttpCatalogClient(HttpClient httpClient, URI catalogBaseUri) {
        this.httpClient = httpClient;
        this.catalogBaseUri = catalogBaseUri;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<ReservedStockLine> reserve(String correlationId, List<StockItem> items) {
        return sendReservation("/v1/stock/reservations", correlationId, items);
    }

    @Override
    public void release(String correlationId, List<StockItem> items) {
        sendReservation("/v1/stock/releases", correlationId, items);
    }

    public URI endpoint(String path) {
        return catalogBaseUri.resolve(path);
    }

    private List<ReservedStockLine> sendReservation(
            String path,
            String correlationId,
            List<StockItem> items
    ) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of("items", items));
            HttpRequest request = HttpRequest.newBuilder(endpoint(path))
                    .header("Content-Type", "application/json")
                    .header("x-correlation-id", correlationId)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw CatalogRequestException.from(response.statusCode(), response.body());
            }
            if (response.statusCode() == 204) {
                return List.of();
            }
            JsonNode itemsNode = objectMapper.readTree(response.body()).path("items");
            List<ReservedStockLine> result = new ArrayList<>();
            for (JsonNode item : itemsNode) {
                result.add(new ReservedStockLine(
                        item.path("productId").asText(),
                        item.path("productName").asText(),
                        item.path("unitPriceAmount").asInt(),
                        item.path("quantity").asInt()
                ));
            }
            return result;
        } catch (CatalogRequestException error) {
            throw error;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new CatalogUnavailableException("Catalog request interrupted", error);
        } catch (Exception error) {
            throw new CatalogUnavailableException("Catalog request failed", error);
        }
    }

    public static final class CatalogUnavailableException extends RuntimeException {
        public CatalogUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static final class CatalogRequestException extends RuntimeException {
        private final int status;

        private CatalogRequestException(int status, String message) {
            super(message);
            this.status = status;
        }

        static CatalogRequestException from(int status, String body) {
            return new CatalogRequestException(status, "Catalog rejected request (" + status + "): " + body);
        }

        public int status() {
            return status;
        }
    }
}
