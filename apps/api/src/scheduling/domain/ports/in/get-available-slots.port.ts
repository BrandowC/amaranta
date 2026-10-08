export interface GetAvailableSlotsQuery {
  professionalId: string;
  /** ISO date, e.g. "2026-09-28" — interpreted in the server's local time zone. */
  date: string;
}

export interface BookedRange {
  scheduledAt: string;
  durationMinutes: number;
}

export interface AvailableSlotsResult {
  isClosed: boolean;
  openMinute: number;
  closeMinute: number;
  booked: BookedRange[];
}

/**
 * A read model, not a new invariant — it hands the frontend the day's business-hours window
 * plus what's already booked, and the frontend computes free slots itself. The actual "is this
 * slot valid" check still happens where it always has, in Appointment.schedule().
 */
export interface GetAvailableSlotsUseCasePort {
  execute(query: GetAvailableSlotsQuery): Promise<AvailableSlotsResult>;
}
