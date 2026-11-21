"use client";
import { createContext, useContext } from "react";
import type { MealLogRepository, ProfileRepository } from "@/domain/nutrition";

export interface NutritionDeps {
  logs: MealLogRepository;
  profile: ProfileRepository;
}

const Ctx = createContext<NutritionDeps | null>(null);
export const NutritionDepsProvider = Ctx.Provider;

export function useNutritionDeps(): NutritionDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("NutritionDepsProvider missing");
  return v;
}
