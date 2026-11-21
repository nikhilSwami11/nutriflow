"use client";
import { createContext, useContext } from "react";
import type { AuthRepository } from "@/domain/auth";

const Ctx = createContext<AuthRepository | null>(null);
export const AuthDepsProvider = Ctx.Provider;

export function useAuthRepo(): AuthRepository {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthDepsProvider missing");
  return v;
}
