import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';

/**
 * Stand-in for `notification-service` (see 02-domain/domain-events.md).
 * In the monolith this just logs; once Sales is extracted, this listener is
 * deleted and OrderCreated travels over RabbitMQ to the real notification-service.
 */
@Injectable()
export class OrderCreatedListener {
  private readonly logger = new Logger('notification-service (simulated)');

  @OnEvent('OrderCreated')
  handle(event: OrderCreatedEvent): void {
    this.logger.log(
      `📧 Confirmation email sent for order ${event.aggregateId} — total ${event.payload.totalCOP} COP`,
    );
  }
}
