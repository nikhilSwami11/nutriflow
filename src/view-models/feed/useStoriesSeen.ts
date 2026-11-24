"use client";
import { useCallback, useState } from "react";

const KEY = "nutriflow.storiesSeen";

const read = (key: string): string[] => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

/** Which stories were opened (or, with another key, which prep jobs are done). Ids carry the date, so it all resets tomorrow. */
export function useStoriesSeen(key = KEY) {
  const [seen, setSeen] = useState<string[]>(() => read(key));
  const markSeen = useCallback((id: string) => {
    setSeen((cur) => {
      if (cur.includes(id)) return cur;
      const next = [...cur, id].slice(-60);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage blocked: seen state just won't persist */
      }
      return next;
    });
  }, [key]);
  const unmark = useCallback((id: string) => {
    setSeen((cur) => {
      const next = cur.filter((x) => x !== id);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage blocked */
      }
      return next;
    });
  }, [key]);
  return { seen, markSeen, unmark };
}
