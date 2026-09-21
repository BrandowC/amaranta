import { Appointment } from '../domain/entities/appointment.entity';
import { AppointmentResult } from '../domain/ports/in/schedule-appointment.port';

export function toAppointmentResult(appointment: Appointment): AppointmentResult {
  return {
    appointmentId: appointment.id,
    petId: appointment.petId,
    ownerId: appointment.ownerId,
    professionalId: appointment.professionalId,
    serviceType: appointment.serviceType,
    scheduledAt: appointment.scheduledAt.toISOString(),
    durationMinutes: appointment.durationMinutes,
    status: appointment.status,
    notes: appointment.notes,
  };
}
