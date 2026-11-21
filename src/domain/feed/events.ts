import { FEED_KINDS, type FeedEvent, type FeedKind } from "./types";

export interface KindStats {
  impressions: number;
  opens: number;
  likes: number;
  saves: number;
  /** mark-eaten and add-to-list: the user acted on the post. */
  acts: number;
  dismisses: number;
  dwellMs: number;
}

const empty = (): KindStats => ({ impressions: 0, opens: 0, likes: 0, saves: 0, acts: 0, dismisses: 0, dwellMs: 0 });

export const WINDOW_MS = 14 * 24 * 3600 * 1000;

/** Count what the user did per kind in the last 14 days. An unlike or unsave cancels its like or save. */
export function summarizeEvents(events: FeedEvent[], now: number): Record<FeedKind, KindStats> {
  const out = Object.fromEntries(FEED_KINDS.map((k) => [k, empty()])) as Record<FeedKind, KindStats>;
  for (const e of events) {
    // Story events are recorded for later learning but do not move posts around.
    if (e.kind === "story" || now - e.ts > WINDOW_MS || !out[e.kind]) continue;
    const s = out[e.kind];
    if (e.action === "impression") {
      s.impressions++;
      s.dwellMs += e.dwellMs ?? 0;
    } else if (e.action === "open") s.opens++;
    else if (e.action === "like") s.likes++;
    else if (e.action === "unlike") s.likes = Math.max(0, s.likes - 1);
    else if (e.action === "save") s.saves++;
    else if (e.action === "unsave") s.saves = Math.max(0, s.saves - 1);
    else if (e.action === "dismiss") s.dismisses++;
    else s.acts++;
  }
  return out;
}

const CAP = 20;

/**
 * How much to move a kind up or down the feed, from -CAP to +CAP.
 * Taps, likes, saves and actions raise it; dismissals lower it harder. Caps keep one habit from burying the rest.
 */
export function kindBoost(s: KindStats): number {
  const up = 2 * s.opens + 3 * s.likes + 3 * s.saves + 2 * s.acts;
  const down = 10 * s.dismisses;
  return Math.max(-CAP, Math.min(CAP, up - down));
}
