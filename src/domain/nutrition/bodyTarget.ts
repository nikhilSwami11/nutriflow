import type { TargetRange } from "./types";

export type BodyGoal = "lose" | "keep" | "build";

/**
 * A calorie range from height, weight and goal. Age and sex are not asked (onboarding keeps to a few questions), so this uses the
 * midpoint of the two Mifflin-St Jeor formulas at age 30 and light activity. It is a starting range the person can change in Profile.
 */
export function targetFromBody(input: { heightCm: number; weightKg: number; goal: BodyGoal }): TargetRange {
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * 30 - 78;
  const keep = bmr * 1.4;
  const aim = input.goal === "lose" ? keep - 400 : input.goal === "build" ? keep + 300 : keep;
  const mid = Math.max(1200, Math.round(aim / 50) * 50);
  return { min: mid - 150, max: mid + 150 };
}
