import type { Recipe } from "../recipes/types";
import type { DayGoals, PlanDay } from "./types";

export type Status = "under" | "ok" | "over";

export interface DayBalance {
  date: string;
  kcal: number;
  protein: number;
  kcalStatus: Status;
  /** Protein is only ever "under" or "ok": more is fine. */
  proteinStatus: "under" | "ok";
}

export interface WeekBalance {
  days: DayBalance[];
  avgKcal: number;
  avgProtein: number;
  notes: string[];
}

const TOLERANCE = 0.1;

export function dayBalance(day: PlanDay, recipes: Recipe[], goals: DayGoals): DayBalance {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const picked = day.meals.map((m) => byId.get(m.recipeId)).filter((r): r is Recipe => !!r);
  const kcal = picked.reduce((s, r) => s + r.kcal, 0);
  const protein = picked.reduce((s, r) => s + r.protein, 0);
  return {
    date: day.date,
    kcal,
    protein,
    kcalStatus: kcal < goals.calories * (1 - TOLERANCE) ? "under" : kcal > goals.calories * (1 + TOLERANCE) ? "over" : "ok",
    proteinStatus: protein < goals.protein * (1 - TOLERANCE) ? "under" : "ok",
  };
}

/** Totals per day, weekly averages, and plain-words notes on where the week is off balance. */
export function weekBalance(plan: PlanDay[], recipes: Recipe[], goals: DayGoals, dayName: (date: string) => string): WeekBalance {
  const days = plan.map((d) => dayBalance(d, recipes, goals));
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const avgKcal = avg(days.map((d) => d.kcal));
  const avgProtein = avg(days.map((d) => d.protein));

  const notes: string[] = [];
  const shortDays = days.filter((d) => d.proteinStatus === "under");
  const offDays = days.filter((d) => d.kcalStatus !== "ok");
  if (shortDays.length) {
    const worst = [...shortDays].sort((a, b) => a.protein - b.protein)[0];
    notes.push(`${dayName(worst.date)} is ${goals.protein - worst.protein} g short on protein.`);
  }
  if (offDays.length) {
    const worst = [...offDays].sort((a, b) => Math.abs(b.kcal - goals.calories) - Math.abs(a.kcal - goals.calories))[0];
    const gap = Math.abs(worst.kcal - goals.calories);
    notes.push(`${dayName(worst.date)} is ${gap.toLocaleString("en-US")} kcal ${worst.kcalStatus === "over" ? "over" : "under"} your goal.`);
  }
  if (!notes.length) notes.push("Every day lands within 10% of your calorie goal and reaches your protein goal.");
  return { days, avgKcal, avgProtein, notes };
}
