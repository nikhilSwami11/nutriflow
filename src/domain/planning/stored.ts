import type { DateKey } from "../nutrition/types";
import { planWeek, type PlanInput } from "./planWeek";
import type { Focus, PlanDay } from "./types";

/** A stored day remembers the focus it was planned with, so "High protein" survives a reload. */
export type StoredDay = PlanDay & { focus: Focus };

/** The stored week plan, one person. */
export interface MealPlanRepository {
  /** Stored days between the dates, inclusive. */
  list(from: DateKey, to: DateKey): Promise<StoredDay[]>;
  /** Adds days. A day someone else already stored (another device, the chat) is kept, not overwritten. */
  add(days: StoredDay[]): Promise<void>;
  /** Removes stored days from this date on, so they are planned again. */
  clearFrom(date: DateKey): Promise<void>;
}

const usable = (day: StoredDay, ids: Set<string>) => day.meals.length > 0 && day.meals.every((m) => ids.has(m.recipeId));

/**
 * The week everyone reads: stored days stay as they are, missing ones are planned and stored. A stored day whose
 * recipes are no longer allowed (diet or dislikes changed) counts as missing. Storage failing never blocks: the
 * computed week is returned anyway. shortcut: filled days do not see the stored ones for the repeat penalty.
 */
export async function ensurePlan(repo: MealPlanRepository, input: Omit<PlanInput, "focus">): Promise<StoredDay[]> {
  const from = input.dates[0];
  const to = input.dates[input.dates.length - 1];
  const ids = new Set(input.recipes.map((r) => r.id));
  const read = async () => new Map((await repo.list(from, to).catch(() => [] as StoredDay[])).filter((d) => usable(d, ids)).map((d) => [d.date, d]));
  let known = await read();
  if (input.dates.every((d) => known.has(d))) return input.dates.map((d) => known.get(d)!);

  // New days keep the focus the person chose last.
  const focus: Focus = [...known.values()].at(-1)?.focus ?? "balanced";
  const fresh = planWeek({ ...input, focus }).map((d) => ({ ...d, focus }));
  const week = fresh.map((d) => known.get(d.date) ?? d);
  // From the first gap on, rows are cleared (unusable ones go) and written again, keeping the days that were fine.
  const gap = input.dates.find((d) => !known.has(d))!;
  try {
    await repo.clearFrom(gap);
    await repo.add(week.filter((d) => d.date >= gap));
    known = await read(); // another device may have stored first: its days win
  } catch {
    // Not stored this time (offline, table missing). The week still shows.
  }
  return week.map((d) => known.get(d.date) ?? d);
}

/** Plans the week again from its first day with this focus ("redo my week", or the High protein switch). */
export async function redoPlan(repo: MealPlanRepository, input: PlanInput): Promise<StoredDay[]> {
  const week = planWeek(input).map((d) => ({ ...d, focus: input.focus }));
  try {
    await repo.clearFrom(input.dates[0]);
    await repo.add(week);
  } catch {
    // Shown, not stored.
  }
  return week;
}
