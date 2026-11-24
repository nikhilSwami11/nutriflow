"use client";
import { createContext, useContext } from "react";
import type { MealLogRepository, ProfileRepository } from "@/domain/nutrition";
import type { MealPlanRepository, PrepDoneRepository } from "@/domain/planning";

export interface NutritionDeps {
  logs: MealLogRepository;
  profile: ProfileRepository;
  /** The stored week plan, shared with the chat. */
  plans: MealPlanRepository;
  /** Prep jobs ticked done, shared with the chat. */
  prep: PrepDoneRepository;
}

const Ctx = createContext<NutritionDeps | null>(null);
export const NutritionDepsProvider = Ctx.Provider;

export function useNutritionDeps(): NutritionDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("NutritionDepsProvider missing");
  return v;
}
