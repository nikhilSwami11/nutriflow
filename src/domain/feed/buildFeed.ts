import type { DateKey } from "../nutrition/types";
import type { MealName } from "../recipes/types";
import { kindBoost, type KindStats } from "./events";
import type { Feed, FeedItem, FeedKind } from "./types";

export interface FeedContext {
  date: DateKey;
  now: number;
  nextMeal: { meal: MealName; recipeId: string } | null;
  /** Running-low pantry items. */
  lowItems: number;
  /** Only the notes that point at a problem. Empty when the week is balanced. */
  planNotes: string[];
  stats: Record<FeedKind, KindStats>;
}

/** Base relevance before personalisation. */
const BASE: Record<FeedKind, number> = { "next-meal": 100, "all-done": 100, "day-chart": 80, "pantry-alert": 60, "plan-nudge": 55 };

/**
 * Rule-based feed: build the candidate posts that apply right now, score each by its base relevance plus how the
 * user has engaged with that kind lately, and order by score. Deterministic. A model can replace `scoreAndOrder`
 * later without touching the contract: it still chooses among these candidates.
 */
export function buildFeed(ctx: FeedContext): Feed {
  const id = (k: FeedKind) => `${k}:${ctx.date}`;
  const candidates: FeedItem[] = [];

  candidates.push(
    ctx.nextMeal
      ? { id: id("next-meal"), kind: "next-meal", meal: ctx.nextMeal.meal, recipeId: ctx.nextMeal.recipeId }
      : { id: id("all-done"), kind: "all-done", reason: "Every meal today is logged" },
  );
  candidates.push({ id: id("day-chart"), kind: "day-chart" });
  if (ctx.lowItems > 0) candidates.push({ id: id("pantry-alert"), kind: "pantry-alert", reason: `${ctx.lowItems} running low` });
  if (ctx.planNotes.length) candidates.push({ id: id("plan-nudge"), kind: "plan-nudge", notes: ctx.planNotes.slice(0, 2), reason: "Your week is off balance" });

  const boost = (i: FeedItem) => kindBoost(ctx.stats[i.kind]);
  const score = (i: FeedItem) => BASE[i.kind] + boost(i);
  // Ties: the kind the user engages with more goes first, then the higher base relevance.
  const items = [...candidates].sort((a, b) => score(b) - score(a) || boost(b) - boost(a) || BASE[b.kind] - BASE[a.kind]);
  return { schemaVersion: 1, generatedAt: ctx.now, items };
}

/** A client only renders what it understands. Unknown kinds or a newer schema are dropped, never crash. */
export function usableItems(feed: { schemaVersion: number; items: { kind: string }[] }, known: readonly string[]): number[] {
  if (feed.schemaVersion !== 1) return [];
  return feed.items.flatMap((it, i) => (known.includes(it.kind) ? [i] : []));
}
