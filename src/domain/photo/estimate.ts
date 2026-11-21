import type { DetectedItem } from "./types";

export interface Estimate {
  kcal: number;
  low: number;
  high: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A photo can't see oil or exact portions, so the honest answer is a range. */
export const RANGE = 0.12;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Totals for the items the user kept, at the amounts they set. */
export function estimateMeal(items: DetectedItem[]): Estimate {
  const kcal = Math.round(sum(items.map((i) => i.amount * i.kcalPer)));
  return {
    kcal,
    low: Math.round(kcal * (1 - RANGE)),
    high: Math.round(kcal * (1 + RANGE)),
    protein: Math.round(sum(items.map((i) => i.amount * i.protein))),
    carbs: Math.round(sum(items.map((i) => i.amount * i.carbs))),
    fat: Math.round(sum(items.map((i) => i.amount * i.fat))),
  };
}

/** Start from what this person usually eats: scale every amount by their usual servings (1 = standard). */
export function scaleForHabit(items: DetectedItem[], usualServings: number): DetectedItem[] {
  if (!(usualServings > 0) || usualServings === 1) return items;
  return items.map((i) => ({ ...i, amount: Math.round((i.amount * usualServings) / i.step) * i.step }));
}

export const changeAmount = (item: DetectedItem, direction: 1 | -1): DetectedItem => ({
  ...item,
  amount: Math.max(0, Math.round((item.amount + direction * item.step) * 100) / 100),
});

export interface DayImpact {
  after: number;
  goal: number;
  /** Positive when there is room left, negative when over. */
  left: number;
}

export const dayImpact = (eatenSoFar: number, goal: number, meal: number): DayImpact => ({ after: eatenSoFar + meal, goal, left: goal - (eatenSoFar + meal) });
