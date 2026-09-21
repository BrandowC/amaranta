import { ProductCategory } from '../../value-objects/product-category.enum';

export interface AdminProductView {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceFormatted: string;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
}

export interface ListAllProductsQuery {
  page: number;
  pageSize: number;
}

export interface ListAllProductsResult {
  items: AdminProductView[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ListAllProductsUseCasePort {
  execute(query: ListAllProductsQuery): Promise<ListAllProductsResult>;
}

export interface CreateProductCommand {
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  stockQuantity: number;
  imageUrl: string;
}

export interface CreateProductUseCasePort {
  execute(command: CreateProductCommand): Promise<AdminProductView>;
}

export interface UpdateProductCommand {
  productId: string;
  name?: string;
  description?: string;
  category?: ProductCategory;
  price?: number;
  imageUrl?: string;
}

export interface UpdateProductUseCasePort {
  execute(command: UpdateProductCommand): Promise<AdminProductView>;
}

export interface SetProductStockCommand {
  productId: string;
  stockQuantity: number;
}

export interface SetProductStockUseCasePort {
  execute(command: SetProductStockCommand): Promise<AdminProductView>;
}

export interface SetProductActiveCommand {
  productId: string;
  isActive: boolean;
}

export interface SetProductActiveUseCasePort {
  execute(command: SetProductActiveCommand): Promise<AdminProductView>;
}
