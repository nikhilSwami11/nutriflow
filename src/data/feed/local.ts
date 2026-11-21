import type { FeedEvent, FeedEventRepository } from "@/domain/feed";

export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const KEY = "nutriflow.feedEvents";
const MAX = 500;

/** Events kept in the browser so personalisation survives reloads. Never throws: storage can be blocked. */
export class LocalFeedEventRepository implements FeedEventRepository {
  constructor(private store: KeyValueStore) {}

  private read(): FeedEvent[] {
    try {
      const raw = this.store.getItem(KEY);
      return raw ? (JSON.parse(raw) as FeedEvent[]) : [];
    } catch {
      return [];
    }
  }

  async append(events: FeedEvent[]) {
    if (!events.length) return;
    try {
      this.store.setItem(KEY, JSON.stringify([...this.read(), ...events].slice(-MAX)));
    } catch {
      /* storage full or blocked: losing a few events is fine */
    }
  }

  async recent(sinceTs: number) {
    return this.read().filter((e) => e.ts >= sinceTs);
  }
}
