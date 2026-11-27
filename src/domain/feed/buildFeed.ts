import type { DateKey } from "../nutrition/types";
import type { MealName } from "../recipes/types";
import { kindBoost, type KindStats } from "./events";
import type { Feed, FeedItem, FeedKind, Story } from "./types";

export interface FeedContext {
  date: DateKey;
  now: number;
  nextMeal: { meal: MealName; recipeId: string } | null;
  /** The one meal to eat next by the clock: later today, else tomorrow's first. Becomes the single meal story. */
  eatNext: { meal: MealName; recipeId: string; tomorrow: boolean } | null;
  /** Jobs to do ahead (soak, marinate) for the next meals. */
  prep: number;
  /** Chores for today: still to do, or done today (so a ticked chore stays in the row). Fixed order. */
  chores: { id: string }[];
  /** The first open meal today that is blocked by missing things. `urgent`: it is the very next meal and nothing is on the list yet. */
  shopNow: { meal: MealName; recipeId: string; urgent: boolean } | null;
  /** Running-low pantry items. */
  lowItems: number;
  /** Only the notes that point at a problem. Empty when the week is balanced. */
  planNotes: string[];
  stats: Record<FeedKind, KindStats>;
}

/** Base relevance before personalisation. */
const BASE: Record<FeedKind, number> = { "next-meal": 100, "all-done": 100, "day-chart": 80, "pantry-alert": 60, "plan-nudge": 55, "shop-now": 70 };
/** Shopping leads when the next meal is blocked and nothing is on the list yet; otherwise it follows the meal. */
const URGENT_SHOP = 120;

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
  if (ctx.shopNow) candidates.push({ id: id("shop-now"), kind: "shop-now", ...ctx.shopNow, reason: ctx.shopNow.urgent ? "The next meal is blocked" : "A later meal needs shopping" });
  candidates.push({ id: id("day-chart"), kind: "day-chart" });
  if (ctx.lowItems > 0) candidates.push({ id: id("pantry-alert"), kind: "pantry-alert", reason: `${ctx.lowItems} running low` });
  if (ctx.planNotes.length) candidates.push({ id: id("plan-nudge"), kind: "plan-nudge", notes: ctx.planNotes.slice(0, 2), reason: "Your week is off balance" });

  const boost = (i: FeedItem) => kindBoost(ctx.stats[i.kind]);
  const score = (i: FeedItem) => (i.kind === "shop-now" && i.urgent ? URGENT_SHOP : BASE[i.kind]) + boost(i);
  // Ties: the kind the user engages with more goes first, then the higher base relevance.
  const items = [...candidates].sort((a, b) => score(b) - score(a) || boost(b) - boost(a) || BASE[b.kind] - BASE[a.kind]);
  return { schemaVersion: 1, generatedAt: ctx.now, items, stories: buildStories(ctx) };
}

/**
 * Eat next (one story, not one per meal), prep for the next meals, then chores, then pantry and plan when they apply.
 * Order is fixed: the row should not jump around. The meal story id carries the recipe, so it is new again once you
 * have eaten and the next meal takes its place.
 */
export function buildStories(ctx: FeedContext): Story[] {
  const stories: Story[] = [];
  if (ctx.eatNext) stories.push({ id: `story:meal:${ctx.date}:${ctx.eatNext.recipeId}`, kind: "meal", ...ctx.eatNext });
  if (ctx.prep > 0) stories.push({ id: `story:prep:${ctx.date}`, kind: "prep" });
  stories.push(...ctx.chores.map((c): Story => ({ id: `story:chore:${c.id}:${ctx.date}`, kind: "chore", choreId: c.id })));
  if (ctx.lowItems > 0) stories.push({ id: `story:pantry:${ctx.date}`, kind: "pantry" });
  if (ctx.planNotes.length) stories.push({ id: `story:plan:${ctx.date}`, kind: "plan", notes: ctx.planNotes.slice(0, 2) });
  return stories;
}

/** A client only renders what it understands. Unknown kinds or a newer schema are dropped, never crash. */
export function usableItems(feed: { schemaVersion: number; items: { kind: string }[] }, known: readonly string[]): number[] {
  if (feed.schemaVersion !== 1) return [];
  return feed.items.flatMap((it, i) => (known.includes(it.kind) ? [i] : []));
}
