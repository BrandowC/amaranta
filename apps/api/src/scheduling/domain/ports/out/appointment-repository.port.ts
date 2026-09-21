import { Appointment } from '../../entities/appointment.entity';

export const APPOINTMENT_REPOSITORY_PORT = Symbol('APPOINTMENT_REPOSITORY_PORT');

export interface AppointmentRepositoryPort {
  save(appointment: Appointment): Promise<void>;
  findById(id: string): Promise<Appointment | null>;
  findByOwner(ownerId: string): Promise<Appointment[]>;
  findByProfessional(professionalId: string): Promise<Appointment[]>;
  /** Active (non-cancelled) appointments for a professional overlapping [scheduledAt, scheduledAt+durationMinutes). */
  findOverlapping(professionalId: string, scheduledAt: Date, durationMinutes: number): Promise<Appointment[]>;
}
