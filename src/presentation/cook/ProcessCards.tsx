"use client";
import { useState } from "react";
import type { CookModel } from "@/view-models/cook/useCook";
import { verbColor } from "../shared/verbColor";

type Tile = CookModel["prep"]["process"][number];
const MORE = 4;
const when = (t: Tile) => (t.steps.length === 0 ? "Before step 1" : t.steps.length === 1 ? `Step ${t.steps[0]}` : `Steps ${t.steps.slice(0, -1).join(", ")} and ${t.steps[t.steps.length - 1]}`);
const color = (v: string) => (v === "Wash" ? "var(--sky)" : verbColor(v));
const arrow = (d: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

/** The whole cook, one action at a time and no scrolling: pick an action on the strip, flip through, and turn on Parallel to see what can run at the same time. */
export function ProcessCards({ tiles }: { tiles: Tile[] }) {
  const [at, setAt] = useState(0);
  const [parallel, setParallel] = useState(false);
  const t = tiles[at];
  if (!t) return null;
  const shown = t.items.slice(0, MORE);
  const rest = t.items.length - shown.length;

  return (
    <section aria-label="The process" className="flex flex-col gap-3">
      <div role="tablist" aria-label="Actions" className="flex flex-wrap gap-1.5">
        {tiles.map((x, i) => (
          <button key={x.verb} type="button" role="tab" aria-selected={i === at} onClick={() => setAt(i)} className={`touch rounded-full border px-3.5 text-sm ${i === at ? "border-transparent bg-mint font-medium text-onp" : "border-line2 bg-bg text-ink2"}`}>{x.verb}</button>
        ))}
      </div>

      <div role="tabpanel" aria-label={t.verb} className="flex min-h-[236px] flex-col gap-2.5 rounded-[20px] bg-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full px-3 py-1 text-xs font-medium text-onp" style={{ background: color(t.verb) }}>{t.verb}</span>
          <span className="text-xs text-muted">{when(t)}{t.minutes ? ` · ${t.minutes} min` : ""}</span>
        </div>
        {t.items.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {shown.map((i) => (
              <li key={i.name} className="flex items-baseline justify-between gap-3 text-[15px]">
                <span>{i.name}</span>
                <span className="text-right text-sm tabular-nums text-ink2">{i.amount}</span>
              </li>
            ))}
            {rest > 0 && <li className="text-sm text-ink2">and {rest} more</li>}
          </ul>
        ) : (
          <p className="m-0 text-[15px]">{t.lines.join(" ")}</p>
        )}
        {t.note && <p className="m-0 text-sm text-ink2">{t.note}</p>}

        {parallel && (
          <div className="mt-auto flex flex-col gap-1.5 rounded-2xl bg-bg p-3" aria-label="At the same time">
            <span className="text-xs font-medium text-muted">At the same time</span>
            {t.alongside.length ? t.alongside.map((a) => (
              <div key={a.verb} className="flex items-center gap-2 text-sm">
                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-onp" style={{ background: color(a.verb) }}>{a.verb}</span>
                <span className="min-w-0 flex-1 truncate">{a.label}</span>
                {a.minutes ? <span className="shrink-0 text-xs tabular-nums text-muted">{a.minutes} min</span> : null}
              </div>
            )) : <span className="text-sm text-ink2">Nothing runs alongside this one.</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setAt((i) => Math.max(0, i - 1))} disabled={at === 0} aria-label="Previous action" className="flex h-11 w-11 items-center justify-center rounded-full border border-line2 disabled:opacity-30">{arrow("M15 5l-7 7 7 7")}</button>
        <button type="button" onClick={() => setParallel((p) => !p)} aria-pressed={parallel} className={`touch flex-1 rounded-full border px-4 text-sm font-medium ${parallel ? "border-transparent bg-sky text-onp" : "border-line2 bg-bg text-ink"}`}>Parallel</button>
        <button type="button" onClick={() => setAt((i) => Math.min(tiles.length - 1, i + 1))} disabled={at === tiles.length - 1} aria-label="Next action" className="flex h-11 w-11 items-center justify-center rounded-full border border-line2 disabled:opacity-30">{arrow("M9 5l7 7-7 7")}</button>
      </div>
    </section>
  );
}
