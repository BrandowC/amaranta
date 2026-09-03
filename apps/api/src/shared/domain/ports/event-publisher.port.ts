import { DomainEvent } from '../domain-event';

export const EVENT_PUBLISHER_PORT = Symbol('EVENT_PUBLISHER_PORT');

export interface EventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
}
