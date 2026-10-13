import { DomainEvent } from '../../../shared/domain/domain-event';

export class AppointmentCompletedEvent extends DomainEvent {
  readonly eventType = 'AppointmentCompleted';
  readonly aggregateType = 'Appointment';

  constructor(
    readonly aggregateId: string,
    readonly payload: { petId: string; veterinarianId: string },
  ) {
    super();
  }
}
