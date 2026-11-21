import type { DateKey, DayPoint, IntakeStatus, MealLog, TargetRange } from "./types";

/** Seeds for a day whose logged intake lands in range (design: "Landed in range +15"). */
export const SEEDS_IN_RANGE = 15;

export const logsForDay = (logs: MealLog[], date: DateKey): MealLog[] => logs.filter((l) => l.date === date);

/** null when nothing was logged that day. */
export function dayTotal(logs: MealLog[], date: DateKey): number | null {
  const day = logsForDay(logs, date);
  return day.length ? day.reduce((sum, l) => sum + l.kcal, 0) : null;
}

/** Range is inclusive on both ends. */
export function intakeStatus(kcal: number, range: TargetRange): IntakeStatus {
  return kcal < range.min ? "below" : kcal > range.max ? "above" : "in";
}

/**
 * Seed rule: only a logged day inside the range earns. Missed, below and above all earn 0.
 * No bonus for eating below target, no cost for a missed day.
 */
export function seedsForDay(logs: MealLog[], date: DateKey, range: TargetRange): number {
  const total = dayTotal(logs, date);
  return total !== null && intakeStatus(total, range) === "in" ? SEEDS_IN_RANGE : 0;
}

/** One point per date, in the order given. Unlogged days have kcal null so charts draw a gap. */
export function weekSeries(logs: MealLog[], dates: DateKey[], range: TargetRange): DayPoint[] {
  return dates.map((date) => {
    const kcal = dayTotal(logs, date);
    return { date, kcal, status: kcal === null ? null : intakeStatus(kcal, range) };
  });
}

/** kcal left to the top of the range; never negative. */
export const kcalLeft = (total: number | null, range: TargetRange): number => Math.max(0, range.max - (total ?? 0));
