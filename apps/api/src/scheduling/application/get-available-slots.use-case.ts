import { Inject, Injectable } from '@nestjs/common';
import {
  AvailableSlotsResult,
  GetAvailableSlotsQuery,
  GetAvailableSlotsUseCasePort,
} from '../domain/ports/in/get-available-slots.port';
import { APPOINTMENT_REPOSITORY_PORT, AppointmentRepositoryPort } from '../domain/ports/out/appointment-repository.port';
import { BusinessHours } from '../domain/value-objects/business-hours.vo';

@Injectable()
export class GetAvailableSlotsUseCase implements GetAvailableSlotsUseCasePort {
  constructor(@Inject(APPOINTMENT_REPOSITORY_PORT) private readonly appointmentRepository: AppointmentRepositoryPort) {}

  async execute(query: GetAvailableSlotsQuery): Promise<AvailableSlotsResult> {
    const date = new Date(`${query.date}T00:00:00`);

    if (BusinessHours.isClosedOn(date)) {
      return { isClosed: true, openMinute: BusinessHours.OPEN_MIN, closeMinute: BusinessHours.CLOSE_MIN, booked: [] };
    }

    const appointments = await this.appointmentRepository.findByProfessionalOnDate(query.professionalId, date);

    return {
      isClosed: false,
      openMinute: BusinessHours.OPEN_MIN,
      closeMinute: BusinessHours.CLOSE_MIN,
      booked: appointments.map((a) => ({ scheduledAt: a.scheduledAt.toISOString(), durationMinutes: a.durationMinutes })),
    };
  }
}
