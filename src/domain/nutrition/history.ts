import { toDateKey } from "./dates";
import type { DateKey, MealLog } from "./types";

export interface CalendarCell {
  date: DateKey;
  /** Day of the month, 1-31. */
  day: number;
  /** False for the leading and trailing days that fill the first and last week. */
  inMonth: boolean;
}

/** A month as full weeks, Monday first, so the grid is always 7 columns wide. `month` is 0-11. */
export function monthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // days before the 1st in its week (Monday = 0)
  const days = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(year, month, 1 - lead + i);
    return { date: toDateKey(d), day: d.getDate(), inMonth: d.getMonth() === month };
  });
}

/** The first and last date shown for a month (including the filler days): what to load. */
export function monthSpan(year: number, month: number): { from: DateKey; to: DateKey } {
  const g = monthGrid(year, month);
  return { from: g[0].date, to: g[g.length - 1].date };
}

/** Meals by date, in the order they were logged. */
export function logsByDate(logs: MealLog[]): Map<DateKey, MealLog[]> {
  const out = new Map<DateKey, MealLog[]>();
  for (const l of logs) out.set(l.date, [...(out.get(l.date) ?? []), l]);
  return out;
}

/** In range, or not, for a logged day; null when nothing was logged (a gap, never zero). */
export function dayStatus(kcal: number | null, range: { min: number; max: number }): "in" | "out" | null {
  if (kcal === null) return null;
  return kcal >= range.min && kcal <= range.max ? "in" : "out";
}
