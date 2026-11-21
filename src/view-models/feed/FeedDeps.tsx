"use client";
import { createContext, useContext } from "react";
import type { FeedEventRepository } from "@/domain/feed";

const Ctx = createContext<FeedEventRepository | null>(null);
export const FeedDepsProvider = Ctx.Provider;

export function useFeedEvents(): FeedEventRepository {
  const v = useContext(Ctx);
  if (!v) throw new Error("FeedDepsProvider missing");
  return v;
}
