import type { DayNutrition, Macros } from "./types";

export const leftKcal = (goal: number, eaten: number): number => Math.max(0, goal - eaten);

export interface ChartStats {
  avgEaten: number;
  avgPlanned: number;
  /** Past days (today excluded) within `tolerance` of plan. */
  onPlan: number;
  pastDays: number;
}

export function chartStats(days: DayNutrition[], tolerance = 0.1): ChartStats {
  // Unlogged days are gaps: they do not pull the average down.
  const past = days.slice(0, -1).filter((d): d is DayNutrition & { eaten: number } => d.eaten !== null);
  if (!past.length) return { avgEaten: 0, avgPlanned: 0, onPlan: 0, pastDays: 0 };
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  return {
    avgEaten: avg(past.map((d) => d.eaten)),
    avgPlanned: avg(past.map((d) => d.planned)),
    onPlan: past.filter((d) => Math.abs(d.eaten - d.planned) <= d.planned * tolerance).length,
    pastDays: past.length,
  };
}

/** Share of calories from protein, carbs, fat (4, 4, 9 kcal per gram). Sums to 1. */
export function macroShares(m: Macros): [number, number, number] {
  const kc = [m.protein * 4, m.carbs * 4, m.fat * 9];
  const total = kc[0] + kc[1] + kc[2];
  return total === 0 ? [0, 0, 0] : [kc[0] / total, kc[1] / total, kc[2] / total];
}
