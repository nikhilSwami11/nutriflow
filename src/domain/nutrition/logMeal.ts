import type { MealLogRepository } from "./ports";
import type { MealLog } from "./types";

/** Record a real meal. Called by a finished cook session or a confirmed photo estimate. */
export async function logMeal(repo: MealLogRepository, log: MealLog): Promise<MealLog> {
  if (!Number.isFinite(log.kcal) || log.kcal < 0) throw new Error("kcal must be a number >= 0");
  await repo.add(log);
  return log;
}
