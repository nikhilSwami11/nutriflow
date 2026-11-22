import type { BoughtRecord, BoughtRepository } from "@/domain/shopping";

interface Store {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const KEY = "nutriflow.bought";

/** Recently bought items, kept in the browser. Never throws: storage can be blocked. */
export class LocalBoughtRepository implements BoughtRepository {
  constructor(private store: Store) {}
  async list() {
    try {
      const raw = this.store.getItem(KEY);
      return raw ? (JSON.parse(raw) as BoughtRecord[]) : [];
    } catch {
      return [];
    }
  }
  async save(records: BoughtRecord[]) {
    try {
      this.store.setItem(KEY, JSON.stringify(records));
    } catch {
      /* blocked storage: the history lasts until the page closes */
    }
  }
}
