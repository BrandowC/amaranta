export interface ListProductsQuery {
  page: number;
  pageSize: number;
}

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceFormatted: string;
  stockQuantity: number;
  inStock: boolean;
  imageUrl: string;
}

export interface ListProductsResult {
  items: ProductSummary[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ListProductsUseCasePort {
  execute(query: ListProductsQuery): Promise<ListProductsResult>;
}
