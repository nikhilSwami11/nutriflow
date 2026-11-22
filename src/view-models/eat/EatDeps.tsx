"use client";
import { createContext, useContext } from "react";
import type { RecipeSearch } from "@/domain/eat";

/** Absent without Supabase: typed words then only set the wish chips. */
const Ctx = createContext<RecipeSearch | undefined>(undefined);
export const EatDepsProvider = Ctx.Provider;
export const useRecipeSearch = (): RecipeSearch | undefined => useContext(Ctx);
