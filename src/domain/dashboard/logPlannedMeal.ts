import type { DashboardData, MealName } from "./types";

/**
 * Mark a planned meal as eaten at its recipe's numbers; adds them to today.
 * No-op if that meal already has intake, so a double tap can't double count.
 */
export function logPlannedMeal(data: DashboardData, name: MealName): DashboardData {
  const meal = data.meals.find((m) => m.name === name);
  if (!meal || meal.eaten > 0) return data;
  const { kcal, macros } = data.tonight;
  const days = data.days.map((d, i) =>
    i === data.days.length - 1
      ? {
          ...d,
          eaten: d.eaten + kcal,
          macros: { protein: d.macros.protein + macros.protein, carbs: d.macros.carbs + macros.carbs, fat: d.macros.fat + macros.fat },
        }
      : d,
  );
  return { ...data, days, meals: data.meals.map((m) => (m.name === name ? { ...m, eaten: kcal } : m)) };
}
