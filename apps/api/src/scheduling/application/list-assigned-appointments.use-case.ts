import { Inject, Injectable } from '@nestjs/common';
import {
  ListAssignedAppointmentsQuery,
  ListAssignedAppointmentsUseCasePort,
} from '../domain/ports/in/list-assigned-appointments.port';
import { APPOINTMENT_REPOSITORY_PORT, AppointmentRepositoryPort } from '../domain/ports/out/appointment-repository.port';
import { toAppointmentResult } from './appointment.presenter';

@Injectable()
export class ListAssignedAppointmentsUseCase implements ListAssignedAppointmentsUseCasePort {
  constructor(@Inject(APPOINTMENT_REPOSITORY_PORT) private readonly appointmentRepository: AppointmentRepositoryPort) {}

  async execute(query: ListAssignedAppointmentsQuery) {
    const appointments = await this.appointmentRepository.findByProfessional(query.professionalId);
    return appointments
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .map(toAppointmentResult);
  }
}
