import { AppointmentResult } from './schedule-appointment.port';

export interface ListMyAppointmentsQuery {
  ownerId: string;
}

export interface ListMyAppointmentsUseCasePort {
  execute(query: ListMyAppointmentsQuery): Promise<AppointmentResult[]>;
}
