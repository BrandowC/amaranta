import { Order } from '../domain/entities/order.entity';
import { CheckoutOrderLine, CheckoutResult } from '../domain/ports/in/checkout.port';

export function toCheckoutResult(order: Order): CheckoutResult {
  return {
    orderId: order.id,
    status: order.status,
    channel: order.channel,
    total: order.total.amount,
    totalFormatted: order.total.format(),
    items: order.items.map(toLine),
    createdAt: order.createdAt.toISOString(),
    fulfillmentMethod: order.fulfillmentMethod,
    paymentMethod: order.paymentMethod,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    deliveryAddress: order.deliveryAddress ?? null,
  };
}

function toLine(item: Order['items'][number]): CheckoutOrderLine {
  return {
    productId: item.productId,
    productName: item.productName,
    unitPrice: item.unitPrice.amount,
    quantity: item.quantity,
    subtotal: item.subtotal.amount,
  };
}
