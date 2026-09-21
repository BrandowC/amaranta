import { DomainEvent } from '../../../shared/domain/domain-event';
import { ServiceType } from '../value-objects/service-type.enum';

export class AppointmentScheduledEvent extends DomainEvent {
  readonly eventType = 'AppointmentScheduled';
  readonly aggregateType = 'Appointment';

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      petId: string;
      ownerId: string;
      professionalId: string;
      serviceType: ServiceType;
      scheduledAt: string;
      durationMinutes: number;
    },
  ) {
    super();
  }
}
