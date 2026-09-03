import { OrderChannel } from '../../value-objects/order-channel.enum';
import { FulfillmentMethod } from '../../value-objects/fulfillment-method.enum';
import { PaymentMethod } from '../../value-objects/payment-method.enum';

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutCommand {
  customerId: string;
  createdBy: string;
  channel: OrderChannel;
  items: CheckoutItem[];
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  contactName: string;
  contactPhone: string;
  deliveryAddress?: string;
}

export interface CheckoutOrderLine {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CheckoutResult {
  orderId: string;
  status: string;
  channel: string;
  total: number;
  totalFormatted: string;
  items: CheckoutOrderLine[];
  createdAt: string;
  fulfillmentMethod: string;
  paymentMethod: string;
  contactName: string;
  contactPhone: string;
  deliveryAddress: string | null;
}

export interface CheckoutUseCasePort {
  execute(command: CheckoutCommand): Promise<CheckoutResult>;
}
