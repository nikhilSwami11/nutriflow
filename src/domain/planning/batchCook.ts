import type { DateKey } from "../nutrition/types";
import type { Recipe } from "../recipes/types";
import type { PlanDay } from "./types";

/** A dish this quick is eaten fresh, not cooked ahead. */
const FRESH_MINUTES = 10;
/** Food keeps this many days in the fridge; later days thaw from the freezer. */
const FRIDGE_DAYS = 3;

export interface CookSession {
  /** The day you cook. */
  date: DateKey;
  /** What to cook, with how many servings to make so every covered meal has one. */
  dishes: { recipe: Recipe; servings: number }[];
  /** About how long the session takes: the longest dish plus a share of the rest, since pots run side by side. */
  minutes: number;
  /** The meals this session covers, in order. */
  covers: { date: DateKey; meal: string; recipeId: string }[];
}

export interface BatchPlan {
  sessions: CookSession[];
  /** Meals cooked as you go: quick dishes, and meals before the first cook day. */
  fresh: { date: DateKey; meal: string; recipeId: string }[];
}

const dayNumber = (d: DateKey) => Math.round(Date.parse(`${d}T00:00:00Z`) / 86_400_000);

/**
 * Turns a week plan into a few cooking days. `cookDates` are the days you chose (e.g. Monday and Thursday). A meal is cooked on the
 * latest cook day on or before it, and each meal type is cooked as one dish for the whole session; a meal before your first cook day, and any quick dish, is cooked as you go (`fresh`).
 */
export function batchCook(plan: PlanDay[], recipes: Recipe[], cookDates: DateKey[]): BatchPlan {
  const days = [...cookDates].sort();
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const sessions = new Map<DateKey, { rows: CookSession["covers"] }>(days.map((d) => [d, { rows: [] }]));
  const fresh: BatchPlan["fresh"] = [];
  if (!days.length) return { sessions: [], fresh };

  for (const day of plan) {
    for (const m of day.meals) {
      const r = byId.get(m.recipeId);
      if (!r) continue;
      const row = { date: day.date, meal: m.meal, recipeId: m.recipeId };
      if (r.minutes <= FRESH_MINUTES) { fresh.push(row); continue; }
      const on = [...days].reverse().find((c) => c <= day.date);
      // Before your first cook day there is nothing cooked ahead: cook as you go.
      if (on) sessions.get(on)!.rows.push(row); else fresh.push(row);
    }
  }

  const out: CookSession[] = [];
  for (const [date, { rows: planned }] of sessions) {
    if (!planned.length) continue;
    // Meal prep is a few dishes in bulk, not one of everything: each meal type (lunch, dinner...) is cooked once for the whole session.
    const first = new Map<string, string>();
    const rows = planned.map((r) => ({ ...r, recipeId: first.get(r.meal) ?? (first.set(r.meal, r.recipeId), r.recipeId) }));
    const per = new Map<string, number>();
    for (const row of rows) per.set(row.recipeId, (per.get(row.recipeId) ?? 0) + 1);
    const dishes = [...per].map(([id, n]) => ({ recipe: byId.get(id)!, servings: n }));
    const times = dishes.map((d) => d.recipe.minutes).sort((a, b) => b - a);
    const minutes = Math.round((times[0] + times.slice(1).reduce((s, t) => s + t * 0.5, 0)) / 5) * 5;
    out.push({ date, dishes, minutes, covers: rows });
  }
  return { sessions: out, fresh };
}

/** True when a meal is eaten more than the fridge allows after its cook day (it should be frozen). */
export const needsFreezer = (cookDate: DateKey, eatDate: DateKey) => dayNumber(eatDate) - dayNumber(cookDate) >= FRIDGE_DAYS;

/** The next `n` days of the week named by weekday numbers (0 = Sunday), starting at `from`: the default cook days. */
export function nextCookDates(from: DateKey, weekdays: number[], within = 7): DateKey[] {
  const start = dayNumber(from);
  const out: DateKey[] = [];
  for (let i = 0; i < within; i++) {
    const t = new Date((start + i) * 86_400_000);
    if (weekdays.includes(t.getUTCDay())) out.push(t.toISOString().slice(0, 10));
  }
  return out;
}
