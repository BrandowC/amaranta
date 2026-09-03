import { randomUUID } from 'crypto';
import { DomainException } from '../../../shared/domain/domain-exception';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { DomainEvent } from '../../../shared/domain/domain-event';
import { OrderItem, OrderItemProps } from './order-item';
import { OrderStatus } from '../value-objects/order-status.enum';
import { OrderChannel } from '../value-objects/order-channel.enum';
import { FulfillmentMethod } from '../value-objects/fulfillment-method.enum';
import { PaymentMethod } from '../value-objects/payment-method.enum';
import { OrderCreatedEvent } from '../events/order-created.event';

export interface OrderProps {
  id: string;
  customerId: string;
  channel: OrderChannel;
  createdBy: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  contactName: string;
  contactPhone: string;
  deliveryAddress?: string;
}

/**
 * Aggregate Root — Sales bounded context.
 * OrderItem[] cannot be persisted or queried independently of their Order
 * (AGGR-INV-ORDER-001..004, see 02-domain/entities-and-rules.md).
 */
export class Order {
  private readonly events: DomainEvent[] = [];

  private constructor(private props: OrderProps) {}

  static checkout(input: {
    customerId: string;
    createdBy: string;
    channel: OrderChannel;
    items: OrderItemProps[];
    fulfillmentMethod: FulfillmentMethod;
    paymentMethod: PaymentMethod;
    contactName: string;
    contactPhone: string;
    deliveryAddress?: string;
  }): Order {
    // AGGR-INV-ORDER-004: at least one item.
    if (input.items.length === 0) {
      throw new DomainException('INV-ORDER-004', 'an order must have at least one item');
    }

    // AGGR-INV-ORDER-003: no duplicate product lines.
    const productIds = input.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new DomainException('INV-ORDER-003', 'an order cannot contain the same product twice');
    }

    if (!input.contactName.trim() || !input.contactPhone.trim()) {
      throw new DomainException('INV-ORDER-006', 'contact name and phone are required to place an order');
    }

    // A DELIVERY order is meaningless without an address — enforced here (not only in the
    // checkout form) so no future caller (receptionist flow, API client) can bypass it.
    if (input.fulfillmentMethod === FulfillmentMethod.DELIVERY && !input.deliveryAddress?.trim()) {
      throw new DomainException('INV-ORDER-007', 'a delivery order requires a delivery address');
    }

    const order = new Order({
      id: randomUUID(),
      customerId: input.customerId,
      createdBy: input.createdBy,
      channel: input.channel,
      items: input.items.map((item) => OrderItem.create(item)),
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      fulfillmentMethod: input.fulfillmentMethod,
      paymentMethod: input.paymentMethod,
      contactName: input.contactName.trim(),
      contactPhone: input.contactPhone.trim(),
      deliveryAddress: input.fulfillmentMethod === FulfillmentMethod.DELIVERY ? input.deliveryAddress?.trim() : undefined,
    });

    order.events.push(
      new OrderCreatedEvent(order.id, {
        customerId: order.customerId,
        channel: order.channel,
        items: order.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        totalCOP: order.total.amount,
      }),
    );

    return order;
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get channel(): OrderChannel {
    return this.props.channel;
  }

  get items(): readonly OrderItem[] {
    return this.props.items;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get fulfillmentMethod(): FulfillmentMethod {
    return this.props.fulfillmentMethod;
  }

  get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  get contactName(): string {
    return this.props.contactName;
  }

  get contactPhone(): string {
    return this.props.contactPhone;
  }

  get deliveryAddress(): string | undefined {
    return this.props.deliveryAddress;
  }

  /** AGGR-INV-ORDER-001: total always equals the sum of item subtotals — never set directly. */
  get total(): Money {
    return this.props.items.reduce((sum, item) => sum.add(item.subtotal), Money.zero());
  }

  markAsPaid(): void {
    if (this.props.status !== OrderStatus.PENDING) {
      throw new DomainException('INV-ORDER-005', 'only a PENDING order can be marked as PAID');
    }
    this.props.status = OrderStatus.PAID;
  }

  get domainEvents(): readonly DomainEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}
