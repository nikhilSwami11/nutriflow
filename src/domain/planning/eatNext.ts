import { mealForHour } from "../eat/suggest";
import { cookability, type Cookability } from "../guide/cookability";
import type { PantryItem } from "../pantry/types";
import { MEALS, type MealName, type Recipe } from "../recipes/types";

/**
 * Which of today's planned meals to eat next, by the clock: the first one not eaten whose time has not passed.
 * A skipped breakfast is not offered at 8 pm. Returns its index in `meals`, or -1 when nothing is left today.
 */
export function eatNextIndex(meals: MealName[], eaten: MealName[], hour: number): number {
  const now = MEALS.indexOf(mealForHour(hour));
  return meals.findIndex((m) => !eaten.includes(m) && MEALS.indexOf(m) >= now);
}

export interface DayMeal {
  meal: MealName;
  recipe: Recipe;
}

/** Today's meals still to come, by the clock and what was eaten: the next one first. */
export function upcomingMeals(today: DayMeal[], eaten: MealName[], hour: number): DayMeal[] {
  const i = eatNextIndex(today.map((m) => m.meal), eaten, hour);
  return i < 0 ? [] : today.slice(i).filter((m) => !eaten.includes(m.meal));
}

export interface EatNext extends DayMeal {
  /** Nothing is left today, so this is tomorrow's first meal. */
  tomorrow: boolean;
  /** What stands between the pantry and cooking it: swaps, skips, things to buy. */
  cook: Cookability;
  /** The rest of today after this one. */
  then: DayMeal[];
}

/** The one meal to eat next and what blocks it. The same answer for Home, stories and the chat. */
export function eatNext(input: { today: DayMeal[]; tomorrow: DayMeal[]; eaten: MealName[]; hour: number; pantry: PantryItem[] }): EatNext | null {
  const open = upcomingMeals(input.today, input.eaten, input.hour);
  const pick = open[0] ?? input.tomorrow[0];
  return pick ? { ...pick, tomorrow: !open[0], cook: cookability(pick.recipe, input.pantry), then: open.slice(1) } : null;
}
