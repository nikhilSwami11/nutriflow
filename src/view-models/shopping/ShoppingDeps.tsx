"use client";
import { createContext, useContext } from "react";
import type { BuyAdvisor } from "@/domain/pantry";
import type { BoughtRepository, ShoppingPrefsRepository } from "@/domain/shopping";

export interface ShoppingDeps {
  prefs: ShoppingPrefsRepository;
  bought: BoughtRepository;
  /** Absent without Supabase: amounts then stay as the recipes say. */
  advisor?: BuyAdvisor;
}

const Ctx = createContext<ShoppingDeps | null>(null);
export const ShoppingDepsProvider = Ctx.Provider;

export function useShoppingDeps(): ShoppingDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("ShoppingDepsProvider missing");
  return v;
}
