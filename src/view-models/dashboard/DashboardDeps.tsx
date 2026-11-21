"use client";
import { createContext, useContext } from "react";
import type { DashboardRepository } from "@/domain/dashboard";

const Ctx = createContext<DashboardRepository | null>(null);
export const DashboardDepsProvider = Ctx.Provider;

export function useDashboardRepo(): DashboardRepository {
  const v = useContext(Ctx);
  if (!v) throw new Error("DashboardDepsProvider missing");
  return v;
}
