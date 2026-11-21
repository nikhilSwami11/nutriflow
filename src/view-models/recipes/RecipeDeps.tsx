"use client";
import { createContext, useContext } from "react";
import type { RecipeRepository } from "@/domain/recipes";

const Ctx = createContext<RecipeRepository | null>(null);
export const RecipeDepsProvider = Ctx.Provider;

export function useRecipeRepo(): RecipeRepository {
  const v = useContext(Ctx);
  if (!v) throw new Error("RecipeDepsProvider missing");
  return v;
}
