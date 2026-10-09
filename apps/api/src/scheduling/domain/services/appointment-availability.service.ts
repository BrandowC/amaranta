import { DomainException } from '../../../shared/domain/domain-exception';
import { BusinessHours } from '../value-objects/business-hours.vo';
import { AppointmentRepositoryPort } from '../ports/out/appointment-repository.port';

/**
 * Domain Service — spans a repository query and the BusinessHours value object, which is why
 * it does not belong to a single entity. Used by ScheduleAppointmentUseCase before the
 * aggregate is created (see AGGR-INV-APPT-001/002).
 *
 * Framework-free by design (no NestJS decorators): the module wires it via a `useFactory`
 * provider instead, so this file stays plain TypeScript like the rest of domain/.
 */
export class AppointmentAvailabilityService {
  constructor(private readonly appointmentRepository: AppointmentRepositoryPort) {}

  async assertAvailable(professionalId: string, scheduledAt: Date, durationMinutes: number): Promise<void> {
    if (!BusinessHours.isWithinBusinessHours(scheduledAt, durationMinutes)) {
      throw new DomainException(
        'INV-APPT-001',
        'appointment must be between 07:00-12:00 or 14:00-18:00, Monday to Saturday',
      );
    }

    const overlapping = await this.appointmentRepository.findOverlapping(professionalId, scheduledAt, durationMinutes);
    if (overlapping.length > 0) {
      throw new DomainException('INV-APPT-002', 'professional already booked in this time range');
    }
  }
}
