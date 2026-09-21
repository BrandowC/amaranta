import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { EVENT_PUBLISHER_PORT, EventPublisherPort } from '../../shared/domain/ports/event-publisher.port';
import { CompleteAppointmentCommand, CompleteAppointmentUseCasePort } from '../domain/ports/in/complete-appointment.port';
import { APPOINTMENT_REPOSITORY_PORT, AppointmentRepositoryPort } from '../domain/ports/out/appointment-repository.port';

@Injectable()
export class CompleteAppointmentUseCase implements CompleteAppointmentUseCasePort {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY_PORT) private readonly appointmentRepository: AppointmentRepositoryPort,
    @Inject(EVENT_PUBLISHER_PORT) private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(command: CompleteAppointmentCommand): Promise<void> {
    const appointment = await this.appointmentRepository.findById(command.appointmentId);
    if (!appointment) {
      throw new DomainException('APPOINTMENT_NOT_FOUND', `Appointment ${command.appointmentId} does not exist`);
    }
    if (appointment.professionalId !== command.completedBy) {
      throw new DomainException('FORBIDDEN', 'only the assigned professional can complete this appointment');
    }

    appointment.complete();
    await this.appointmentRepository.save(appointment);

    for (const event of appointment.domainEvents) {
      await this.eventPublisher.publish(event);
    }
    appointment.clearEvents();
  }
}
