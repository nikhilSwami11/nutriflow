"use client";
import { createContext, useContext } from "react";
import type { MealDetector, PantryScanner } from "@/domain/photo";

export interface PhotoDeps {
  detector: MealDetector;
  /** Reads shelf and receipt photos. Only with an account: the model lives behind an edge function. */
  scanner?: PantryScanner;
}

const Ctx = createContext<PhotoDeps | null>(null);
export const PhotoDepsProvider = Ctx.Provider;

function usePhotoDeps(): PhotoDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("PhotoDepsProvider missing");
  return v;
}

export const useMealDetector = (): MealDetector => usePhotoDeps().detector;
export const usePantryScanner = (): PantryScanner | undefined => usePhotoDeps().scanner;
