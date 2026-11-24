import type { MealPlanRepository, StoredDay } from "@/domain/planning";

/** Offline: the plan lives for this tab only. */
export class InMemoryMealPlanRepository implements MealPlanRepository {
  private days: StoredDay[] = [];
  async list(from: string, to: string) {
    return this.days.filter((d) => d.date >= from && d.date <= to);
  }
  async add(days: StoredDay[]) {
    for (const d of days) if (!this.days.some((x) => x.date === d.date)) this.days.push(d);
  }
  async clearFrom(date: string) {
    this.days = this.days.filter((d) => d.date < date);
  }
}
