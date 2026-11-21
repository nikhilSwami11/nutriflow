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

/** A story: a short, tappable card in the row above the feed. Live data is bound by the client, like posts. */
export type Story =
  | { id: string; kind: "meal"; meal: MealName; recipeId: string }
  | { id: string; kind: "pantry" }
  | { id: string; kind: "plan"; notes: string[] };

export type EventKind = FeedKind | "story";

export interface Feed {
  /** Bump when an item shape changes incompatibly. Clients drop kinds and versions they do not know. */
  schemaVersion: 1;
  generatedAt: number;
  items: FeedItem[];
  /** Added after v1 shipped: optional so older feeds still parse. */
  stories?: Story[];
}

export type FeedAction = "impression" | "open" | "like" | "unlike" | "save" | "unsave" | "dismiss" | "mark-eaten" | "add-to-list";

/** What the user did with a post. Sent back so the ranking can learn. */
export interface FeedEvent {
  itemId: string;
  kind: EventKind;
  action: FeedAction;
  /** Index in the feed when it happened. */
  position: number;
  /** Only on impressions: how long the post was on screen. */
  dwellMs?: number;
  ts: number;
}

export const FEED_KINDS: FeedKind[] = ["next-meal", "all-done", "day-chart", "pantry-alert", "plan-nudge"];
