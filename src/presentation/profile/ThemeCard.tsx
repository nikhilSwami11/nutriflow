"use client";
import { useSyncExternalStore } from "react";

const KEY = "nutriflow.theme";
const OPTIONS = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]] as const;
type Theme = (typeof OPTIONS)[number][0];

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => (listeners.add(fn), () => void listeners.delete(fn));
const read = (): Theme => {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "auto";
};

function choose(t: Theme) {
  const el = document.documentElement;
  if (t === "auto") delete el.dataset.theme;
  else el.dataset.theme = t;
  try {
    if (t === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    // Private window: the choice lasts until the tab closes.
  }
  listeners.forEach((fn) => fn());
}

/** Light, Dark, or follow the phone. The chart reads its colours when it opens, so it picks the change up on its next visit. */
export function ThemeCard() {
  const theme = useSyncExternalStore(subscribe, read, () => "auto" as Theme);
  return (
    <section aria-label="Appearance" className="flex flex-col gap-2 rounded-[20px] bg-panel p-4">
      <h2 className="m-0 text-base font-medium">Appearance</h2>
      <div role="group" aria-label="Theme" className="flex gap-2">
        {OPTIONS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={theme === id} onClick={() => choose(id)} className={`touch rounded-full border px-4 text-sm font-medium ${theme === id ? "border-transparent bg-mint text-onp" : "border-line2 bg-transparent text-ink"}`}>{label}</button>
        ))}
      </div>
    </section>
  );
}
