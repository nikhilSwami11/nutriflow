"use client";
import { useSyncExternalStore } from "react";

/** Client-only match; false on the server. Lets a screen render one layout instead of hiding a second. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", notify);
      return () => m.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
