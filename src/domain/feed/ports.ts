import type { FeedEvent } from "./types";

export interface FeedEventRepository {
  append(events: FeedEvent[]): Promise<void>;
  /** Events at or after `sinceTs`, oldest first. */
  recent(sinceTs: number): Promise<FeedEvent[]>;
}
