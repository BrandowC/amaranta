import { AppointmentResult } from './schedule-appointment.port';

export interface ListAssignedAppointmentsQuery {
  professionalId: string;
}

export interface ListAssignedAppointmentsUseCasePort {
  execute(query: ListAssignedAppointmentsQuery): Promise<AppointmentResult[]>;
}
