/**
 * Value Object — encapsulates the clinic's operating window (07:00-22:00, Monday to Saturday)
 * in exactly one place, per AGGR-INV-APPT-001. An appointment's full span, start to end, must
 * fit inside this window — it may never run past closing time.
 */
export class BusinessHours {
  /** Public so read models (e.g. the available-slots endpoint) can render the window without duplicating it. */
  static readonly OPEN_MIN = 7 * 60;
  static readonly CLOSE_MIN = 22 * 60;

  static isWithinBusinessHours(scheduledAt: Date, durationMinutes: number): boolean {
    if (this.isClosedOn(scheduledAt)) return false;

    const startMin = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
    const endMin = startMin + durationMinutes;

    return startMin >= this.OPEN_MIN && endMin <= this.CLOSE_MIN;
  }

  static isClosedOn(date: Date): boolean {
    return date.getDay() === 0; // Sunday
  }
}
