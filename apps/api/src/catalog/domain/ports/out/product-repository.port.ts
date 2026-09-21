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
}
