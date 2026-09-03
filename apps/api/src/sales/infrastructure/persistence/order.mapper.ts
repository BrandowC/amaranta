import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderItemOrmEntity } from './order-item.orm-entity';

export class OrderMapper {
  static toDomain(row: OrderOrmEntity): Order {
    return Order.reconstitute({
      id: row.id,
      customerId: row.customerId,
      createdBy: row.createdBy,
      channel: row.channel,
      status: row.status,
      createdAt: row.createdAt,
      fulfillmentMethod: row.fulfillmentMethod,
      paymentMethod: row.paymentMethod,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      deliveryAddress: row.deliveryAddress ?? undefined,
      items: (row.items ?? []).map((item) =>
        OrderItem.create({
          productId: item.productId,
          productName: item.productName,
          unitPrice: Money.cop(item.unitPriceAmount),
          quantity: item.quantity,
        }),
      ),
    });
  }

  static toPersistence(order: Order): OrderOrmEntity {
    const row = new OrderOrmEntity();
    row.id = order.id;
    row.customerId = order.customerId;
    row.createdBy = order.createdBy;
    row.channel = order.channel;
    row.status = order.status;
    row.totalAmount = order.total.amount;
    row.createdAt = order.createdAt;
    row.fulfillmentMethod = order.fulfillmentMethod;
    row.paymentMethod = order.paymentMethod;
    row.contactName = order.contactName;
    row.contactPhone = order.contactPhone;
    row.deliveryAddress = order.deliveryAddress ?? null;
    row.items = order.items.map((item) => {
      const itemRow = new OrderItemOrmEntity();
      itemRow.productId = item.productId;
      itemRow.productName = item.productName;
      itemRow.unitPriceAmount = item.unitPrice.amount;
      itemRow.quantity = item.quantity;
      itemRow.subtotalAmount = item.subtotal.amount;
      return itemRow;
    });
    return row;
  }
}
