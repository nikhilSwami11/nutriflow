"use client";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { summarizeEvents, WINDOW_MS, type EventKind, type FeedAction, type FeedEvent } from "@/domain/feed";
import { useFeedEvents } from "./FeedDeps";

const FLUSH_MS = 4000;

/**
 * Past engagement, read once per visit. It is deliberately not refreshed while you scroll,
 * so liking a post never reshuffles the feed under your thumb; the next visit reflects it.
 */
export function useFeedStats() {
  const repo = useFeedEvents();
  const q = useQuery({
    queryKey: ["feed-stats"],
    queryFn: async () => {
      const now = Date.now();
      return summarizeEvents(await repo.recent(now - WINDOW_MS), now);
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return q.data;
}

/** Collects what the user does and sends it in batches: every few seconds, when the tab hides, and on leave. */
export function useFeedTracker() {
  const repo = useFeedEvents();
  const queue = useRef<FeedEvent[]>([]);

  const flush = useCallback(() => {
    if (!queue.current.length) return;
    const batch = queue.current;
    queue.current = [];
    void repo.append(batch).catch(() => {
      queue.current = [...batch, ...queue.current]; // keep them for the next try
    });
  }, [repo]);

  useEffect(() => {
    const id = setInterval(flush, FLUSH_MS);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  return useCallback(
    (item: { id: string; kind: EventKind }, action: FeedAction, position: number, dwellMs?: number) => {
      queue.current.push({ itemId: item.id, kind: item.kind, action, position, dwellMs, ts: Date.now() });
    },
    [],
  );
}
