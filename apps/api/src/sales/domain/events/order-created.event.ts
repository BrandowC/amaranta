import { DomainEvent } from '../../../shared/domain/domain-event';
import { OrderChannel } from '../value-objects/order-channel.enum';

export class OrderCreatedEvent extends DomainEvent {
  readonly eventType = 'OrderCreated';
  readonly aggregateType = 'Order';

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      customerId: string;
      channel: OrderChannel;
      items: { productId: string; quantity: number }[];
      totalCOP: number;
    },
  ) {
    super();
  }
}
