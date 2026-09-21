/**
 * Driven port — what Clinical needs from Scheduling to enforce "a medical record can only be
 * written for a COMPLETED appointment" (INV-MEDREC-003). Implemented in-process today; would
 * become an HTTP call once Clinical and Scheduling are separate services.
 */
export const APPOINTMENT_STATUS_PORT = Symbol('APPOINTMENT_STATUS_PORT');

export interface AppointmentSnapshot {
  appointmentId: string;
  petId: string;
  veterinarianId: string;
  isCompleted: boolean;
}

export interface AppointmentStatusPort {
  getAppointment(appointmentId: string): Promise<AppointmentSnapshot | null>;
}
