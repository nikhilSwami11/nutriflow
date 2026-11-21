import type { MealName, Recipe } from "../recipes/types";
import { MEALS } from "../recipes/types";
import type { DateKey } from "../nutrition/types";
import type { DayGoals, Focus, PlanDay } from "./types";

/** Share of the day's calories and protein each meal should carry. */
const SHARE: Record<MealName, number> = { Breakfast: 0.25, Lunch: 0.35, Snack: 0.1, Dinner: 0.3 };

export interface PlanInput {
  recipes: Recipe[];
  goals: DayGoals;
  /** How many times each recipe was eaten before. Familiar meals get a small bonus. */
  history: Record<string, number>;
  dates: DateKey[];
  focus: Focus;
}

/**
 * Fill every meal of every day from the recipes, aiming at the calorie and protein goals.
 * Each pick minimises: distance from this meal's calorie target, protein shortfall,
 * and repeats (recently used recipes cost more), minus a bonus for meals eaten before.
 * Targets adapt as the day fills: whatever is left is split over the remaining meals.
 * Deterministic: ties break by recipe id.
 */
export function planWeek({ recipes, goals, history, dates, focus }: PlanInput): PlanDay[] {
  const proteinWeight = focus === "protein" ? 2.5 : 1.2;
  const used: string[][] = []; // recipe ids per planned day, oldest first

  return dates.map((date) => {
    let kcalLeft = goals.calories;
    let proteinLeft = goals.protein;
    const meals: PlanDay["meals"] = [];
    const todays: string[] = [];

    MEALS.forEach((meal, i) => {
      const options = recipes.filter((r) => r.meal === meal);
      if (!options.length) return;
      const remainingShare = MEALS.slice(i).reduce((s, m) => s + SHARE[m], 0);
      const kcalTarget = (kcalLeft * SHARE[meal]) / remainingShare;
      const proteinTarget = (proteinLeft * SHARE[meal]) / remainingShare;

      const cost = (r: Recipe) => {
        const calGap = Math.abs(r.kcal - kcalTarget) / Math.max(kcalTarget, 1);
        const proteinGap = Math.max(0, proteinTarget - r.protein) / Math.max(proteinTarget, 1);
        const recent = used.slice(-2).filter((d) => d.includes(r.id)).length;
        const earlier = used.slice(0, -2).filter((d) => d.includes(r.id)).length;
        const familiar = Math.min(history[r.id] ?? 0, 4) / 4;
        return 3 * calGap + proteinWeight * proteinGap + 0.6 * recent + 0.15 * earlier - 0.2 * familiar;
      };

      const pick = [...options].sort((a, b) => cost(a) - cost(b) || a.id.localeCompare(b.id))[0];
      meals.push({ meal, recipeId: pick.id });
      todays.push(pick.id);
      kcalLeft -= pick.kcal;
      proteinLeft -= pick.protein;
    });
    used.push(todays);
    return { date, meals };
  });
}
