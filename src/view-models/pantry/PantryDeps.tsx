"use client";
import { createContext, useContext } from "react";
import type { PantryRepository, ShoppingListRepository, UtteranceParser } from "@/domain/pantry";

export interface PantryDeps {
  pantry: PantryRepository;
  list: ShoppingListRepository;
  parser: UtteranceParser;
  newId: () => string;
}

const Ctx = createContext<PantryDeps | null>(null);
export const PantryDepsProvider = Ctx.Provider;

export function usePantryDeps(): PantryDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("PantryDepsProvider missing");
  return v;
}
