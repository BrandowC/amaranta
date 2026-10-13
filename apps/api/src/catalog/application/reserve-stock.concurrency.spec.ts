import { ReserveStockUseCase } from './reserve-stock.use-case';
import { Product } from '../domain/entities/product.entity';
import { ProductRepositoryPort, PaginatedResult } from '../domain/ports/out/product-repository.port';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { ProductCategory } from '../domain/value-objects/product-category.enum';
import { DomainException } from '../../shared/domain/domain-exception';

/** Reads back a plain, independent snapshot of a Product's state via its public getters. */
function cloneProps(product: Product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    stockQuantity: product.stockQuantity,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
  };
}

/**
 * Faithfully reproduces the concurrency behavior of the REAL `ProductRepository`
 * (apps/api/src/catalog/infrastructure/persistence/product.repository.ts):
 * - `findByIds`/`findById` return an independent snapshot of the last COMMITTED row — no row
 *   lock, no visibility into another in-flight request's uncommitted mutation.
 * - `tryDecrementStock` mirrors the real repo's single conditional `UPDATE ... WHERE
 *   stock_quantity >= :qty`: the check and the write happen with no `await` between them, so
 *   nothing else can run in between — exactly what a real SQL statement's row-level lock
 *   guarantees during its own execution.
 *
 * BEFORE THE FIX, this same test (against the old read-then-decrement-then-`saveMany`
 * `ReserveStockUseCase`) reproduced a real oversell: two concurrent requests for the last unit
 * of stock both succeeded, and the final `stockQuantity` was 0 instead of one request being
 * correctly rejected. Verified run, before the fix:
 *   [RACE TEST] requests that succeeded: 2/2 | final stockQuantity: 0 (started at 1)
 * See `sales-api-decisions.md` / the retro forum post for the full incident writeup.
 */
class RaceAwareInMemoryProductRepository implements ProductRepositoryPort {
  private rows = new Map<string, ReturnType<typeof cloneProps>>();

  seed(product: Product): void {
    this.rows.set(product.id, cloneProps(product));
  }

  private hydrate(id: string): Product | null {
    const row = this.rows.get(id);
    return row ? Product.reconstitute({ ...row }) : null;
  }

  async findActivePaginated(): Promise<PaginatedResult<Product>> {
    throw new Error('not used in this test');
  }

  async findAllPaginated(): Promise<PaginatedResult<Product>> {
    throw new Error('not used in this test');
  }

  async findById(id: string): Promise<Product | null> {
    await new Promise((resolve) => setTimeout(resolve, 2)); // stand-in for real DB round-trip latency
    return this.hydrate(id);
  }

  async findBySku(): Promise<Product | null> {
    throw new Error('not used in this test');
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    await new Promise((resolve) => setTimeout(resolve, 2)); // stand-in for real DB round-trip latency
    return ids.map((id) => this.hydrate(id)).filter((p): p is Product => !!p);
  }

  async save(product: Product): Promise<void> {
    this.rows.set(product.id, cloneProps(product));
  }

  async saveMany(products: Product[]): Promise<void> {
    for (const product of products) this.rows.set(product.id, cloneProps(product));
  }

  async deleteById(): Promise<void> {
    throw new Error('not used in this test');
  }

  /** The fix: one atomic conditional decrement, equivalent to the real repo's `UPDATE ... WHERE stock_quantity >= :qty`. */
  async tryDecrementStock(productId: string, quantity: number): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 3)); // stand-in for real DB round-trip latency
    const row = this.rows.get(productId);
    if (!row || row.stockQuantity < quantity) return false; // check + write below: no `await` in between
    row.stockQuantity -= quantity;
    return true;
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 3));
    const row = this.rows.get(productId);
    if (row) row.stockQuantity += quantity;
  }

  stockOf(id: string): number {
    return this.rows.get(id)!.stockQuantity;
  }
}

describe('ReserveStockUseCase — concurrent checkout race condition (fixed)', () => {
  it('does not oversell the last unit: exactly one of two concurrent reservations succeeds', async () => {
    const repo = new RaceAwareInMemoryProductRepository();
    const product = Product.create({
      sku: 'FOOD-DOG-3KG',
      name: 'Dog food 3kg',
      description: 'Adult dog dry food, 3kg bag',
      category: ProductCategory.FOOD,
      price: Money.cop(45000),
      stockQuantity: 1, // <- only ONE unit left
      imageUrl: '/images/dog-food.png',
    });
    repo.seed(product);

    const useCase = new ReserveStockUseCase(repo);

    // Two customers, at the same time, both try to buy the last unit.
    const [resultA, resultB] = await Promise.allSettled([
      useCase.execute({ items: [{ productId: product.id, quantity: 1 }] }),
      useCase.execute({ items: [{ productId: product.id, quantity: 1 }] }),
    ]);

    const succeeded = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const rejected = [resultA, resultB].filter((r) => r.status === 'rejected');
    const finalStock = repo.stockOf(product.id);

    // eslint-disable-next-line no-console
    console.log(
      `[RACE TEST — after fix] requests that succeeded: ${succeeded.length}/2 | ` +
        `final stockQuantity: ${finalStock} (started at 1)`,
    );

    expect(succeeded).toHaveLength(1);
    expect(finalStock).toBe(0);

    // The loser gets a real, correct business error — not a silent failure and not an oversell.
    expect(rejected).toHaveLength(1);
    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(reason).toBeInstanceOf(DomainException);
    expect((reason as DomainException).code).toBe('INV-PRODUCT-002');
  });

  it('reserving 2 items, where the 2nd is out of stock, releases the 1st back (compensation)', async () => {
    const repo = new RaceAwareInMemoryProductRepository();
    const plentiful = Product.create({
      sku: 'FOOD-CAT-1KG',
      name: 'Cat food 1kg',
      description: 'Adult cat dry food, 1kg bag',
      category: ProductCategory.FOOD,
      price: Money.cop(20000),
      stockQuantity: 5,
      imageUrl: '/images/cat-food.png',
    });
    const scarce = Product.create({
      sku: 'TOY-BALL',
      name: 'Rubber ball',
      description: 'Small rubber ball toy',
      category: ProductCategory.TOYS,
      price: Money.cop(8000),
      stockQuantity: 0,
      imageUrl: '/images/ball.png',
    });
    repo.seed(plentiful);
    repo.seed(scarce);

    const useCase = new ReserveStockUseCase(repo);

    await expect(
      useCase.execute({
        items: [
          { productId: plentiful.id, quantity: 2 },
          { productId: scarce.id, quantity: 1 },
        ],
      }),
    ).rejects.toThrow(DomainException);

    // The 1st item's reservation must not leak just because the 2nd failed.
    expect(repo.stockOf(plentiful.id)).toBe(5);
  });
});
