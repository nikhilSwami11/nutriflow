import type { DateKey, MealLog, MealLogRepository } from "@/domain/nutrition";
import type { KeyValueStore } from "../feed/local";

const KEY = "nutriflow.mealLogQueue";
const REMOVALS = "nutriflow.mealLogRemovals";

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

  private removals(): string[] {
    try {
      const raw = this.store.getItem(REMOVALS);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private writeRemovals(ids: string[]) {
    try {
      this.store.setItem(REMOVALS, JSON.stringify(ids));
    } catch {
      /* storage blocked */
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

  /** Undo. A meal still waiting in the queue is simply dropped; one already saved is deleted, and if the database is down the delete waits and retries. */
  async remove(id: string) {
    this.write(this.read().filter((l) => l.id !== id));
    try {
      await this.primary.remove(id);
    } catch {
      const r = this.removals();
      if (!r.includes(id)) this.writeRemovals([...r, id]);
    }
  }

  async listBetween(from: DateKey, to: DateKey) {
    let remote: MealLog[] = [];
    try {
      remote = await this.primary.listBetween(from, to);
    } catch {
      /* offline: show what is queued */
    }
    const gone = new Set(this.removals());
    remote = remote.filter((l) => !gone.has(l.id));
    const ids = new Set(remote.map((l) => l.id));
    const waiting = this.read().filter((l) => l.date >= from && l.date <= to && !ids.has(l.id));
    return [...remote, ...waiting];
  }

  /** Try to send everything waiting. Returns how many are still waiting. */
  async flush(): Promise<number> {
    const stillGone: string[] = [];
    for (const id of this.removals()) {
      try {
        await this.primary.remove(id);
      } catch {
        stillGone.push(id);
      }
    }
    this.writeRemovals(stillGone);
    const left: MealLog[] = [];
    for (const log of this.read()) {
      try {
        await this.primary.add(log);
      } catch {
        left.push(log);
      }
    }
    this.write(left);
    return left.length + stillGone.length;
  }

  pending(): number {
    return this.read().length + this.removals().length;
  }
}
