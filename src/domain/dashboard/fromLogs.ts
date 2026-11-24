import { lastNDays } from "../nutrition/dates";
import type { MealLog, TargetRange } from "../nutrition/types";
import type { MealName } from "../recipes/types";
import type { DashboardData, DayNutrition, Goals } from "./types";

const MEAL: Record<MealLog["slot"], MealName> = { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" };

/** Daily goals from the calorie range: the middle of it, split 22% protein, 48% carbs, 30% fat. */
export function goalsFromRange(range: TargetRange): Goals {
  const calories = Math.round((range.min + range.max) / 2);
  return { calories, protein: Math.round((calories * 0.22) / 4), carbs: Math.round((calories * 0.48) / 4), fat: Math.round((calories * 0.3) / 9) };
}

/**
 * The person's own dashboard, from their meal logs only: a day with nothing logged is a gap (eaten null), never zero,
 * and a new account has an empty history. The last day is today.
 */
export function dashboardFromLogs(logs: MealLog[], today: Date, range: TargetRange, days = 30): DashboardData {
  const goals = goalsFromRange(range);
  const dates = lastNDays(days, today);
  const series: DayNutrition[] = dates.map((date) => {
    const day = logs.filter((l) => l.date === date);
    const sum = (f: (l: MealLog) => number | undefined) => Math.round(day.reduce((s, l) => s + (f(l) ?? 0), 0));
    return {
      date,
      planned: goals.calories,
      eaten: day.length ? sum((l) => l.kcal) : null,
      macros: { protein: sum((l) => l.protein), carbs: sum((l) => l.carbs), fat: sum((l) => l.fat) },
    };
  });
  const todayKey = dates[dates.length - 1];
  const history: Record<string, number> = {};
  for (const l of logs) if (l.recipeId && l.date !== todayKey) history[l.recipeId] = (history[l.recipeId] ?? 0) + 1;
  const eatenToday = [...new Set(logs.filter((l) => l.date === todayKey).map((l) => MEAL[l.slot]))];
  return { goals, days: series, eatenToday, history };
}
