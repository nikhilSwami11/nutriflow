import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventKind, FeedAction, FeedEvent, FeedEventRepository } from "@/domain/feed";

interface Row {
  item_id: string;
  kind: EventKind;
  action: FeedAction;
  position: number;
  dwell_ms: number | null;
  created_at: string;
}

export const toRow = (e: FeedEvent) => ({
  item_id: e.itemId,
  kind: e.kind,
  action: e.action,
  position: e.position,
  dwell_ms: e.dwellMs ?? null,
  created_at: new Date(e.ts).toISOString(),
});

export const fromRow = (r: Row): FeedEvent => ({
  itemId: r.item_id,
  kind: r.kind,
  action: r.action,
  position: r.position,
  dwellMs: r.dwell_ms ?? undefined,
  ts: new Date(r.created_at).getTime(),
});

/** Server copy of the events, for the server-side feed builder to learn from. Not wired in yet: needs migration 0004. */
export class SupabaseFeedEventRepository implements FeedEventRepository {
  constructor(private db: SupabaseClient) {}
  async append(events: FeedEvent[]) {
    if (!events.length) return;
    const { error } = await this.db.from("feed_events").insert(events.map(toRow));
    if (error) throw error;
  }
  async recent(sinceTs: number) {
    const { data, error } = await this.db
      .from("feed_events").select("item_id,kind,action,position,dwell_ms,created_at")
      .gte("created_at", new Date(sinceTs).toISOString()).order("created_at");
    if (error) throw error;
    return (data as Row[]).map(fromRow);
  }
}
