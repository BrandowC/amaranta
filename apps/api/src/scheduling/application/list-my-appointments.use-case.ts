import { Inject, Injectable } from '@nestjs/common';
import { ListMyAppointmentsQuery, ListMyAppointmentsUseCasePort } from '../domain/ports/in/list-my-appointments.port';
import { APPOINTMENT_REPOSITORY_PORT, AppointmentRepositoryPort } from '../domain/ports/out/appointment-repository.port';
import { toAppointmentResult } from './appointment.presenter';

@Injectable()
export class ListMyAppointmentsUseCase implements ListMyAppointmentsUseCasePort {
  constructor(@Inject(APPOINTMENT_REPOSITORY_PORT) private readonly appointmentRepository: AppointmentRepositoryPort) {}

  async execute(query: ListMyAppointmentsQuery) {
    const appointments = await this.appointmentRepository.findByOwner(query.ownerId);
    return appointments
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .map(toAppointmentResult);
  }
}
