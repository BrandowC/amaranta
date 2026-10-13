// Read contract extracted from the monolith's HU-CAT-001 projection.
// No NestJS, persistence or other bounded-context imports belong here.
export interface ProductSnapshot {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
}

export interface ProductQueryPort {
  findActive(
    page: number,
    pageSize: number,
  ): Promise<{
    items: ProductSnapshot[];
    total: number;
  }>;
}
