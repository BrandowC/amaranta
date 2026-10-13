/**
 * Value Object — encapsulates the physical store's operating window (08:00-12:00 and
 * 14:00-18:00, Monday to Saturday) per AGGR-INV-ORDER-008. An order (online or in-store) can
 * only be placed while the store is open to actually prepare it for pickup, delivery or an
 * in-person sale.
 */
export class ShopHours {
  private static readonly MORNING_START_MIN = 8 * 60;
  private static readonly MORNING_END_MIN = 12 * 60;
  private static readonly AFTERNOON_START_MIN = 14 * 60;
  private static readonly AFTERNOON_END_MIN = 18 * 60;

  static isWithinShopHours(at: Date): boolean {
    const dayOfWeek = at.getDay(); // 0 = Sunday
    if (dayOfWeek === 0) return false;

    const nowMin = at.getHours() * 60 + at.getMinutes();
    const withinMorning = nowMin >= this.MORNING_START_MIN && nowMin < this.MORNING_END_MIN;
    const withinAfternoon = nowMin >= this.AFTERNOON_START_MIN && nowMin < this.AFTERNOON_END_MIN;

    return withinMorning || withinAfternoon;
  }
}
