import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ProductStockPort,
  ReservedStockLine,
  StockItemRequest,
} from '../../domain/ports/out/product-stock.port';

type CatalogResponse = {
  items?: Array<{
    productId: string;
    productName: string;
    unitPriceAmount: number;
    quantity: number;
  }>;
  code?: string;
  message?: string;
};

@Injectable()
export class HttpCatalogStockAdapter implements ProductStockPort {
  constructor(private readonly baseUrl: string) {}

  async reserve(items: StockItemRequest[]): Promise<ReservedStockLine[]> {
    const response = await this.request('/v1/stock/reservations', items);
    return response.items ?? [];
  }

  async release(items: StockItemRequest[]): Promise<void> {
    await this.request('/v1/stock/releases', items);
  }

  private async request(path: string, items: StockItemRequest[]): Promise<CatalogResponse> {
    let response: Response;
    try {
      response = await fetch(new URL(path, this.baseUrl), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-correlation-id': randomUUID(),
        },
        body: JSON.stringify({ items }),
      });
    } catch (error) {
      const detail = error instanceof Error ? `: ${error.message}` : '';
      throw new Error(`Catalog service is unavailable${detail}`);
    }

    const body = (await response.json().catch(() => ({}))) as CatalogResponse;
    if (!response.ok) {
      throw new Error(body.message ?? `Catalog service rejected the request (${response.status})`);
    }
    return body;
  }
}
