"use client";
import { createContext, useContext } from "react";
import type { MealDetector } from "@/domain/photo";

const Ctx = createContext<MealDetector | null>(null);
export const PhotoDepsProvider = Ctx.Provider;

export function useMealDetector(): MealDetector {
  const v = useContext(Ctx);
  if (!v) throw new Error("PhotoDepsProvider missing");
  return v;
}
