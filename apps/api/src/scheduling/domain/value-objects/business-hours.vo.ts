/**
 * Value Object — encapsulates Amaranta's operating window (07:00-12:00 and 14:00-18:00,
 * Monday to Saturday) in exactly one place, per AGGR-INV-APPT-001. An appointment's full span,
 * start to end, must fit inside one of the two windows — it may never straddle the lunch break
 * or run past closing time.
 */
export class BusinessHours {
  private static readonly MORNING_START_MIN = 7 * 60;
  private static readonly MORNING_END_MIN = 12 * 60;
  private static readonly AFTERNOON_START_MIN = 14 * 60;
  private static readonly AFTERNOON_END_MIN = 18 * 60;

  static isWithinBusinessHours(scheduledAt: Date, durationMinutes: number): boolean {
    const dayOfWeek = scheduledAt.getDay(); // 0 = Sunday
    if (dayOfWeek === 0) return false;

    const startMin = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
    const endMin = startMin + durationMinutes;

    const withinMorning = startMin >= this.MORNING_START_MIN && endMin <= this.MORNING_END_MIN;
    const withinAfternoon = startMin >= this.AFTERNOON_START_MIN && endMin <= this.AFTERNOON_END_MIN;

    return withinMorning || withinAfternoon;
  }
}
