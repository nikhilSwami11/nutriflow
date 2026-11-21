"use client";
import { useEffect, useRef } from "react";
import type { FeedAction, FeedItem } from "@/view-models/feed/types";

const SEEN_MS = 1000;

/**
 * Records an impression once a post has been at least half visible for a second, with how long it stayed.
 * Sent when the post scrolls away or the feed unmounts.
 */
export function Tracked({ item, position, track, children }: { item: FeedItem; position: number; track: (i: FeedItem, a: FeedAction, pos: number, dwellMs?: number) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ item, position, track });
  useEffect(() => {
    latest.current = { item, position, track };
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let since: number | null = null;
    const end = () => {
      if (since === null) return;
      const dwell = Date.now() - since;
      since = null;
      if (dwell >= SEEN_MS) latest.current.track(latest.current.item, "impression", latest.current.position, dwell);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && since === null) since = Date.now();
        else if (!entry.isIntersecting) end();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      end();
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
