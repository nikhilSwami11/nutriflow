import { logMeal } from "../nutrition/logMeal";
import type { MealLogRepository } from "../nutrition/ports";
import type { DateKey, MealLog, MealSlot } from "../nutrition/types";
import type { Estimate } from "./estimate";

export interface PhotoLogInput {
  id: string;
  date: DateKey;
  slot: MealSlot;
  name: string;
  estimate: Estimate;
}

/** A photo meal is an estimate, but once the user confirms it, it is logged like any other. */
export function logPhotoMeal(logs: MealLogRepository, { id, date, slot, name, estimate }: PhotoLogInput): Promise<MealLog> {
  return logMeal(logs, { id, date, slot, source: "photo", name, kcal: estimate.kcal, protein: estimate.protein, carbs: estimate.carbs, fat: estimate.fat });
}

/** Undo the log. Safe to call twice. */
export const undoLog = (logs: MealLogRepository, id: string): Promise<void> => logs.remove(id);
