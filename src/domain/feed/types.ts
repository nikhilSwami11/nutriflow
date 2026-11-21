import type { MealName } from "../recipes/types";

export type FeedKind = "next-meal" | "all-done" | "day-chart" | "pantry-alert" | "plan-nudge";

/**
 * One post. The feed says WHICH posts, in WHAT order, and WHY. Live numbers (the chart, pantry quantities,
 * what is eaten) are bound by the client, so a stale feed never shows stale data.
 * Ids are per kind per day, so the same post is the same item all day.
 */
export type FeedItem =
  | { id: string; kind: "next-meal"; meal: MealName; recipeId: string; reason?: string }
  | { id: string; kind: "all-done"; reason?: string }
  | { id: string; kind: "day-chart"; reason?: string }
  | { id: string; kind: "pantry-alert"; reason?: string }
  | { id: string; kind: "plan-nudge"; notes: string[]; reason?: string };

export interface Feed {
  /** Bump when an item shape changes incompatibly. Clients drop kinds and versions they do not know. */
  schemaVersion: 1;
  generatedAt: number;
  items: FeedItem[];
}

export type FeedAction = "impression" | "open" | "like" | "unlike" | "save" | "unsave" | "dismiss" | "mark-eaten" | "add-to-list";

/** What the user did with a post. Sent back so the ranking can learn. */
export interface FeedEvent {
  itemId: string;
  kind: FeedKind;
  action: FeedAction;
  /** Index in the feed when it happened. */
  position: number;
  /** Only on impressions: how long the post was on screen. */
  dwellMs?: number;
  ts: number;
}

export const FEED_KINDS: FeedKind[] = ["next-meal", "all-done", "day-chart", "pantry-alert", "plan-nudge"];
