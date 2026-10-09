import { ListProducts } from '../src/application/list-products';

describe('HU-CAT-001 listing', () => {
  it('keeps zero-stock products visible and formats integer COP', async () => {
    const product = {
      id: 'id',
      sku: 'SKU',
      name: 'Food',
      description: 'Food',
      category: 'FOOD',
      price: 8500,
      stockQuantity: 0,
      imageUrl: '',
    };
    const findActive = jest.fn().mockResolvedValue({ items: [product], total: 1 });
    const result = await new ListProducts({ findActive }).execute();
    expect(findActive).toHaveBeenCalledWith(1, 50);
    expect(result.items[0]).toMatchObject({ price: 8500, inStock: false });
    expect(result.items[0].priceFormatted).toContain('8.500');
  });
  it.each([
    [0, 10],
    [1, 51],
    [1, 0],
    [1.5, 10],
    [Infinity, 10],
    [1000001, 10],
  ])('rejects invalid pagination %s/%s before persistence', async (page, size) => {
    const findActive = jest.fn();
    await expect(new ListProducts({ findActive }).execute(page, size)).rejects.toThrow(RangeError);
    expect(findActive).not.toHaveBeenCalled();
  });
});
