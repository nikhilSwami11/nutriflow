"use client";
import { createContext, useContext } from "react";
import type { ServingHabitRepository } from "@/domain/cooking";
import type { LeftoverRepository } from "@/domain/leftovers";

export interface CookDeps {
  habits: ServingHabitRepository;
  /** Cooked portions still in the fridge (browser only for now, so the chat does not see them). */
  leftovers: LeftoverRepository;
  /** Meals saved on this device that have not reached the database yet. */
  pendingLogs: () => number;
}

const Ctx = createContext<CookDeps | null>(null);
export const CookDepsProvider = Ctx.Provider;

export function useCookDeps(): CookDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("CookDepsProvider missing");
  return v;
}
