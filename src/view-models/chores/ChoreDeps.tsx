"use client";
import { createContext, useContext } from "react";
import type { ChoreRepository } from "@/domain/chores";

export interface ChoreDeps {
  repo: ChoreRepository;
  newId: () => string;
}

const Ctx = createContext<ChoreDeps | null>(null);
export const ChoreDepsProvider = Ctx.Provider;

export function useChoreDeps(): ChoreDeps {
  const v = useContext(Ctx);
  if (!v) throw new Error("ChoreDepsProvider missing");
  return v;
}
