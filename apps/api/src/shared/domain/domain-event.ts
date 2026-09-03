import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  readonly eventId: string = randomUUID();
  readonly occurredAt: Date = new Date();
  readonly version = 1;

  abstract readonly eventType: string;
  abstract readonly aggregateId: string;
  abstract readonly aggregateType: string;
}
