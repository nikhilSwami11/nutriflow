import type { DateKey, MealLog, MealLogRepository, Profile, ProfileRepository } from "@/domain/nutrition";

export class InMemoryMealLogRepository implements MealLogRepository {
  constructor(private rows: MealLog[] = []) {}
  async listBetween(from: DateKey, to: DateKey) {
    return this.rows.filter((l) => l.date >= from && l.date <= to);
  }
  async add(log: MealLog) {
    this.rows.push(log);
  }
  async remove(id: string) {
    this.rows = this.rows.filter((l) => l.id !== id);
  }
}

export class InMemoryProfileRepository implements ProfileRepository {
  constructor(private profile: Profile | null = null) {}
  async get() {
    return this.profile;
  }
  async save(p: Profile) {
    this.profile = p;
  }
}
