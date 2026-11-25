"use client";
import { createContext, useContext } from "react";
import type { RecipeAdapter, RecipeSearch, RecipeWriter } from "@/domain/eat";
import type { MyRecipeRepository, RecipeRepository } from "@/domain/recipes";

export interface EatDeps {
  /** The AI that writes a meal. Absent without Supabase: the built-in recipes answer instead. */
  writer?: RecipeWriter;
  /** The AI that changes a recipe by an instruction (Ask AI). Absent without Supabase. */
  adapter?: RecipeAdapter;
  /** Recipes written for or saved by this person. */
  mine: MyRecipeRepository;
  /** The built-in recipes: the fallback, and pictures for written dishes. */
  builtins: RecipeRepository;
  /** Search by meaning; not used by a screen right now. */
  search?: RecipeSearch;
  newId: () => string;
}

const Ctx = createContext<EatDeps | null>(null);
export const EatDepsProvider = Ctx.Provider;
export function useEatDeps(): EatDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("EatDepsProvider missing");
  return v;
}
