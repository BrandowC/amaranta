/**
 * Value Object — encapsulates Amaranta's operating windows (07:00-12:00 and 14:00-18:00,
 * Monday to Saturday) in exactly one place, per AGGR-INV-APPT-001. An appointment's full span,
 * start to end, must fit inside one window and may never straddle the lunch break.
 */
export class BusinessHours {
  static readonly WINDOWS = [
    { openMinute: 7 * 60, closeMinute: 12 * 60 },
    { openMinute: 14 * 60, closeMinute: 18 * 60 },
  ] as const;

  static isWithinBusinessHours(scheduledAt: Date, durationMinutes: number): boolean {
    if (this.isClosedOn(scheduledAt)) return false;

    const startMin = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
    const endMin = startMin + durationMinutes;

    return this.WINDOWS.some(({ openMinute, closeMinute }) => startMin >= openMinute && endMin <= closeMinute);
  }

  static isClosedOn(date: Date): boolean {
    return date.getDay() === 0; // Sunday
  }
}
