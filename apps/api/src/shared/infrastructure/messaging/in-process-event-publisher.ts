import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';
import { DomainEvent } from '../../domain/domain-event';

/**
 * Publishes domain events in-process via EventEmitter2 instead of a broker.
 * This is the single seam to swap for a RabbitMqEventPublisher (see ADR-003)
 * when a bounded context is extracted into its own microservice.
 */
@Injectable()
export class InProcessEventPublisher implements EventPublisherPort {
  private readonly logger = new Logger(InProcessEventPublisher.name);

  constructor(private readonly emitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(`📣 ${event.eventType} — ${event.aggregateType}:${event.aggregateId}`);
    this.emitter.emit(event.eventType, event);
  }
}
