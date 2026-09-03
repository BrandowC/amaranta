export interface Product {
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

export interface ProductListResponse {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  accessToken: string;
}

export interface OrderLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export interface Order {
  orderId: string;
  status: string;
  channel: string;
  total: number;
  totalFormatted: string;
  items: OrderLine[];
  createdAt: string;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  contactName: string;
  contactPhone: string;
  deliveryAddress: string | null;
}

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  contactName: string;
  contactPhone: string;
  deliveryAddress?: string;
}

export interface ApiErrorBody {
  statusCode: number;
  code?: string;
  message: string;
}
