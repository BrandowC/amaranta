import { DomainEvent } from '../../../shared/domain/domain-event';

export class AppointmentCancelledEvent extends DomainEvent {
  readonly eventType = 'AppointmentCancelled';
  readonly aggregateType = 'Appointment';

  constructor(
    readonly aggregateId: string,
    readonly payload: { ownerId: string; cancelledBy: string },
  ) {
    super();
  }
}
