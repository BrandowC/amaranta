import { CheckoutOrderLine } from './checkout.port';

export interface OrderSummary {
  orderId: string;
  status: string;
  channel: string;
  total: number;
  totalFormatted: string;
  items: CheckoutOrderLine[];
  createdAt: string;
}

export interface ListMyOrdersQuery {
  customerId: string;
}

export interface ListMyOrdersUseCasePort {
  execute(query: ListMyOrdersQuery): Promise<OrderSummary[]>;
}
