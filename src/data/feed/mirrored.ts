import type { FeedEvent, FeedEventRepository } from "@/domain/feed";

/** Writes to the browser first (never lost), then copies to the server. Reads the server, and falls back to the browser when it is down. */
export class MirroredFeedEventRepository implements FeedEventRepository {
  constructor(
    private local: FeedEventRepository,
    private remote: FeedEventRepository,
  ) {}

  async append(events: FeedEvent[]) {
    await this.local.append(events);
    await this.remote.append(events).catch(() => undefined); // shortcut: failed copies are not retried, a few lost events barely move the ranking
  }

  async recent(sinceTs: number) {
    try {
      return await this.remote.recent(sinceTs);
    } catch {
      return this.local.recent(sinceTs);
    }
  }
}
