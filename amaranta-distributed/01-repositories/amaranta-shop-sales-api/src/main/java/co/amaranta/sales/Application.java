package co.amaranta.sales;

import java.net.URI;
import java.net.http.HttpClient;

public final class Application {
    private Application() {}

    public static void main(String[] args) {
        URI catalogUri = URI.create(System.getenv().getOrDefault("CATALOG_BASE_URL", "http://localhost:8081"));
        new HttpCatalogClient(HttpClient.newHttpClient(), catalogUri);
        System.out.println("Sales API boundary initialized; Catalog access is contract-based.");
    }
}
