import { Inject, Injectable } from '@nestjs/common';
import { DomainException } from '../../shared/domain/domain-exception';
import { EVENT_PUBLISHER_PORT, EventPublisherPort } from '../../shared/domain/ports/event-publisher.port';
import { Appointment } from '../domain/entities/appointment.entity';
import { DEFAULT_DURATION_MINUTES } from '../domain/value-objects/service-type.enum';
import {
  ScheduleAppointmentCommand,
  ScheduleAppointmentUseCasePort,
} from '../domain/ports/in/schedule-appointment.port';
import { APPOINTMENT_REPOSITORY_PORT, AppointmentRepositoryPort } from '../domain/ports/out/appointment-repository.port';
import {
  SCHED_PET_VERIFICATION_PORT,
  SchedulingPetVerificationPort,
} from '../domain/ports/out/pet-verification.port';
import {
  PROFESSIONAL_VERIFICATION_PORT,
  ProfessionalVerificationPort,
} from '../domain/ports/out/professional-verification.port';
import { AppointmentAvailabilityService } from '../domain/services/appointment-availability.service';
import { toAppointmentResult } from './appointment.presenter';

@Injectable()
export class ScheduleAppointmentUseCase implements ScheduleAppointmentUseCasePort {
  private readonly availability: AppointmentAvailabilityService;

  constructor(
    @Inject(APPOINTMENT_REPOSITORY_PORT) private readonly appointmentRepository: AppointmentRepositoryPort,
    @Inject(SCHED_PET_VERIFICATION_PORT) private readonly petVerification: SchedulingPetVerificationPort,
    @Inject(PROFESSIONAL_VERIFICATION_PORT) private readonly professionalVerification: ProfessionalVerificationPort,
    @Inject(EVENT_PUBLISHER_PORT) private readonly eventPublisher: EventPublisherPort,
  ) {
    this.availability = new AppointmentAvailabilityService(appointmentRepository);
  }

  async execute(command: ScheduleAppointmentCommand) {
    // 1. Verify the pet exists and belongs to the owner making the booking (sync call to
    //    Clinical today, REST tomorrow — see 02-domain/domain-map.md).
    const pet = await this.petVerification.getPetOwnership(command.petId);
    if (!pet) {
      throw new DomainException('PET_NOT_FOUND', `Pet ${command.petId} does not exist`);
    }
    if (pet.ownerId !== command.ownerId) {
      throw new DomainException('FORBIDDEN', 'the pet does not belong to the given owner');
    }

    // 2. Verify the professional holds a role compatible with the requested service type.
    const professional = await this.professionalVerification.getProfessional(command.professionalId);
    if (!professional) {
      throw new DomainException('PROFESSIONAL_NOT_FOUND', `Professional ${command.professionalId} does not exist`);
    }

    const durationMinutes = command.durationMinutes ?? DEFAULT_DURATION_MINUTES[command.serviceType];
    const scheduledAt = new Date(command.scheduledAt);

    // 3. Business hours + no-double-booking (AGGR-INV-APPT-001/002).
    await this.availability.assertAvailable(command.professionalId, scheduledAt, durationMinutes);

    // 4. Build the aggregate — role-service compatibility (AGGR-INV-APPT-004) is validated here.
    const appointment = Appointment.schedule({
      petId: command.petId,
      ownerId: command.ownerId,
      professionalId: command.professionalId,
      professionalRole: professional.role,
      serviceType: command.serviceType,
      scheduledAt,
      durationMinutes,
      createdBy: command.createdBy,
      notes: command.notes,
    });

    await this.appointmentRepository.save(appointment);

    for (const event of appointment.domainEvents) {
      await this.eventPublisher.publish(event);
    }
    appointment.clearEvents();

    return toAppointmentResult(appointment);
  }
}
