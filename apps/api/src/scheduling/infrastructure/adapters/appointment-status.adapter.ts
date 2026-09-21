import { Inject, Injectable } from '@nestjs/common';
import { AppointmentStatusPort, AppointmentSnapshot } from '../../../clinical/domain/ports/out/appointment-status.port';
import { AppointmentStatus } from '../../domain/value-objects/appointment-status.enum';
import { APPOINTMENT_REPOSITORY_PORT, AppointmentRepositoryPort } from '../../domain/ports/out/appointment-repository.port';

/**
 * Implements what Clinical needs from Scheduling (AddMedicalRecordUseCase's
 * "appointment must be COMPLETED" check), backed by Scheduling's own repository.
 * In-process today; would move behind an HTTP endpoint once these are separate services.
 */
@Injectable()
export class AppointmentStatusAdapter implements AppointmentStatusPort {
  constructor(@Inject(APPOINTMENT_REPOSITORY_PORT) private readonly appointmentRepository: AppointmentRepositoryPort) {}

  async getAppointment(appointmentId: string): Promise<AppointmentSnapshot | null> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) return null;
    return {
      appointmentId: appointment.id,
      petId: appointment.petId,
      veterinarianId: appointment.professionalId,
      isCompleted: appointment.status === AppointmentStatus.COMPLETED,
    };
  }
}
