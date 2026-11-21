"use client";
import { useCallback, useState } from "react";

const KEY = "nutriflow.storiesSeen";

const read = (): string[] => {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

/** Which stories were opened. Ids carry the date, so everything is unseen again tomorrow. */
export function useStoriesSeen() {
  const [seen, setSeen] = useState<string[]>(read);
  const markSeen = useCallback((id: string) => {
    setSeen((cur) => {
      if (cur.includes(id)) return cur;
      const next = [...cur, id].slice(-60);
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage blocked: seen state just won't persist */
      }
      return next;
    });
  }, []);
  return { seen, markSeen };
}
