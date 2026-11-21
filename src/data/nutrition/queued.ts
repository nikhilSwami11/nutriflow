import type { DateKey, MealLog, MealLogRepository } from "@/domain/nutrition";
import type { KeyValueStore } from "../feed/local";

const KEY = "nutriflow.mealLogQueue";

/**
 * Meal logs go to the database first. If that fails (offline, table missing, server down) the meal is kept in a
 * small queue in the browser, still shows up in lists, and is retried by `flush`. A meal is never dropped.
 * The database insert is idempotent on id, so a retry after a lost response cannot double count.
 */
export class QueuedMealLogRepository implements MealLogRepository {
  constructor(private primary: MealLogRepository, private store: KeyValueStore) {}

  private read(): MealLog[] {
    try {
      const raw = this.store.getItem(KEY);
      return raw ? (JSON.parse(raw) as MealLog[]) : [];
    } catch {
      return [];
    }
  }

  private write(logs: MealLog[]) {
    try {
      this.store.setItem(KEY, JSON.stringify(logs));
    } catch {
      /* storage blocked: nothing more we can do */
    }
  }

  async add(log: MealLog) {
    try {
      await this.primary.add(log);
    } catch {
      const q = this.read();
      if (!q.some((x) => x.id === log.id)) this.write([...q, log]);
    }
  }

  async listBetween(from: DateKey, to: DateKey) {
    let remote: MealLog[] = [];
    try {
      remote = await this.primary.listBetween(from, to);
    } catch {
      /* offline: show what is queued */
    }
    const ids = new Set(remote.map((l) => l.id));
    const waiting = this.read().filter((l) => l.date >= from && l.date <= to && !ids.has(l.id));
    return [...remote, ...waiting];
  }

  /** Try to send everything waiting. Returns how many are still waiting. */
  async flush(): Promise<number> {
    const left: MealLog[] = [];
    for (const log of this.read()) {
      try {
        await this.primary.add(log);
      } catch {
        left.push(log);
      }
    }
    this.write(left);
    return left.length;
  }

  pending(): number {
    return this.read().length;
  }
}
