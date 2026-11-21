"use client";
import { createContext, useContext } from "react";
import type { ServingHabitRepository } from "@/domain/cooking";

export interface CookDeps {
  habits: ServingHabitRepository;
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
