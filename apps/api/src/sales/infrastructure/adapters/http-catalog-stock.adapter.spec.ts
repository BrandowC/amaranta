import { HttpCatalogStockAdapter } from './http-catalog-stock.adapter';

describe('HttpCatalogStockAdapter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reserves through the versioned Catalog contract and forwards correlation', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              productId: 'p-1',
              productName: 'Food',
              unitPriceAmount: 12500,
              quantity: 2,
            },
          ],
        }),
      ),
    );
    const adapter = new HttpCatalogStockAdapter('http://catalog-api:8081');

    await expect(adapter.reserve([{ productId: 'p-1', quantity: 2 }])).resolves.toEqual([
      { productId: 'p-1', productName: 'Food', unitPriceAmount: 12500, quantity: 2 },
    ]);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe('http://catalog-api:8081/v1/stock/reservations');
    expect(options?.method).toBe('POST');
    expect(options?.headers).toEqual({
      'content-type': 'application/json',
      'x-correlation-id': expect.any(String),
    });
    expect(options?.body).toBe(JSON.stringify({ items: [{ productId: 'p-1', quantity: 2 }] }));
  });

  it('surfaces a Catalog contract error instead of hiding it', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'INV-PRODUCT-002', message: 'out of stock' }), {
        status: 409,
      }),
    );
    const adapter = new HttpCatalogStockAdapter('http://catalog-api:8081');

    await expect(adapter.reserve([{ productId: 'p-1', quantity: 2 }])).rejects.toThrow('out of stock');
  });
});
