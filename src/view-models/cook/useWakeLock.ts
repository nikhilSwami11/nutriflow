"use client";
import { useEffect } from "react";

interface Sentinel {
  release(): Promise<void>;
}

/** Keep the screen on while cooking, when the browser allows it. Re-requests after the tab comes back. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    const wl = (navigator as unknown as { wakeLock?: { request(t: "screen"): Promise<Sentinel> } }).wakeLock;
    if (!active || !wl) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const get = () => wl.request("screen").then((s) => (cancelled ? s.release() : void (sentinel = s))).catch(() => undefined);
    void get();
    const onVisible = () => document.visibilityState === "visible" && void get();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
