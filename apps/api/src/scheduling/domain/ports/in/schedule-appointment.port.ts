import { ServiceType } from '../../value-objects/service-type.enum';

export interface ScheduleAppointmentCommand {
  petId: string;
  ownerId: string;
  professionalId: string;
  serviceType: ServiceType;
  scheduledAt: string;
  durationMinutes?: number;
  createdBy: string;
  notes?: string;
}

export interface AppointmentResult {
  appointmentId: string;
  petId: string;
  ownerId: string;
  professionalId: string;
  serviceType: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  notes?: string;
}

export interface ScheduleAppointmentUseCasePort {
  execute(command: ScheduleAppointmentCommand): Promise<AppointmentResult>;
}
