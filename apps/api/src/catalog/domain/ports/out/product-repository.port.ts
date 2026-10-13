import { Product } from '../../entities/product.entity';

export const PRODUCT_REPOSITORY_PORT = Symbol('PRODUCT_REPOSITORY_PORT');

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ProductRepositoryPort {
  findActivePaginated(page: number, pageSize: number): Promise<PaginatedResult<Product>>;
  findAllPaginated(page: number, pageSize: number): Promise<PaginatedResult<Product>>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  save(product: Product): Promise<void>;
  saveMany(products: Product[]): Promise<void>;
  deleteById(id: string): Promise<void>;

  /**
   * Atomically decrements stock only if enough is available, in one conditional write —
   * `UPDATE ... SET stock = stock - qty WHERE id = :id AND stock >= :qty` — instead of the
   * read-then-decrement-then-write pattern `ReserveStockUseCase` used before, which let two
   * concurrent reservations both read the same stock and both succeed (see
   * `reserve-stock.concurrency.spec.ts`). Returns `false` when there isn't enough stock left
   * AT THE MOMENT OF THE WRITE — which may be because of this same request, or because a
   * concurrent one won the race — never throws for that case.
   */
  tryDecrementStock(productId: string, quantity: number): Promise<boolean>;

  /** Atomic, unconditional increment — used to compensate a reservation that must be undone. */
  incrementStock(productId: string, quantity: number): Promise<void>;
}
