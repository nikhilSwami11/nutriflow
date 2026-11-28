"use client";
import { useState } from "react";
import type { CookModel } from "@/view-models/cook/useCook";
import { verbColor } from "../shared/verbColor";
import { CookMotion } from "./CookMotion";
import { GuideCards } from "./GuideCards";

const color = (v: string) => (v === "Wash" ? "var(--sky)" : verbColor(v));
const tick = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

/** The row of actions that stays on screen the whole cook: a tick when an action is done, the current one in mint. */
export function ActionStrip({ c }: { c: CookModel }) {
  return (
    <div role="tablist" aria-label="Actions" className="flex shrink-0 flex-wrap gap-1.5 px-5 pb-2">
      {c.cards.map((x) => (
        <button key={x.verb} type="button" role="tab" aria-selected={x.current} onClick={x.go} className={`touch inline-flex items-center gap-1.5 rounded-full border px-3.5 text-sm ${x.current ? "border-transparent bg-mint font-medium text-onp" : "border-line2 bg-bg text-ink2"}`}>
          {x.done && <span aria-label="done" className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-bg">{tick}</span>}
          {x.verb}
        </button>
      ))}
    </div>
  );
}

/** One action: its animation, the tasks to tick, what to look for, the timer, and what can run at the same time. */
export function ActionCard({ c }: { c: CookModel }) {
  const x = c.cards.find((k) => k.current)!;
  const [parallel, setParallel] = useState(false);
  return (
    <div role="tabpanel" aria-label={x.verb} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-[96px] shrink-0"><CookMotion verb={x.verb} tint={c.recipe.tint} image={c.recipe.image} small /></div>
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-sm text-muted tabular-nums">Action {c.position.number} of {c.position.count}{x.minutes ? ` · ${x.minutes} min` : ""}</span>
        </div>
      </div>

      <ul aria-label={`${x.verb} tasks`} className="m-0 flex list-none flex-col p-0">
        {x.tasks.map((t) => (
          <li key={t.id} className="border-t border-line first:border-t-0">
            <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
              <input type="checkbox" checked={t.checked} onChange={t.toggle} className="peer sr-only" />
              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-line2 text-bg transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">{tick}</span>
              <span aria-live="polite" className={`text-[20px] font-medium leading-snug tracking-[-0.01em] transition-colors ${t.checked ? "text-muted line-through" : ""}`}>{t.text}</span>
            </label>
          </li>
        ))}
      </ul>

      {c.timer && (
        <div aria-label="Timer" role="group" className="flex items-center justify-between gap-3 rounded-[20px] bg-panel py-3 pl-5 pr-3">
          <span role="status" className="sr-only">{c.timer.done ? "Time is up" : ""}</span>
          <div role="timer" aria-live="off" className="text-[48px] font-medium leading-none tracking-[-0.02em] tabular-nums">{c.timer.done ? "0:00" : c.timer.label}</div>
          {c.timer.done ? (
            <span className="rounded-full bg-mint px-4 py-3 text-sm font-medium text-onp">Time&apos;s up</span>
          ) : (
            <button type="button" onClick={c.timer.toggle} aria-pressed={c.timer.running} className="touch rounded-full bg-ink px-5 text-[15px] font-medium text-bg">{c.timer.running ? "Pause" : c.timer.started ? "Resume" : "Start"}</button>
          )}
        </div>
      )}

      <GuideCards look={c.look} tip={c.tip} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setParallel((p) => !p)} aria-pressed={parallel} className={`touch rounded-full border px-4 text-sm font-medium ${parallel ? "border-transparent bg-sky text-onp" : "border-line2 bg-bg text-ink"}`}>Meanwhile</button>
        <button type="button" onClick={() => c.ask.setOpen(true)} className="hoverable touch inline-flex items-center gap-2 rounded-full border border-line2 px-4 text-sm font-medium">Ask about this step</button>
      </div>
      {parallel && (
        <div aria-label="At the same time" className="flex flex-col gap-1.5 rounded-2xl bg-panel p-3">
          <span className="text-xs font-medium text-muted">At the same time</span>
          {x.alongside.length ? x.alongside.map((a) => (
            <div key={a.verb} className="flex items-center gap-2 text-sm">
              <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-onp" style={{ background: color(a.verb) }}>{a.verb}</span>
              <span className="min-w-0 flex-1 truncate">{a.label}</span>
              {a.minutes ? <span className="shrink-0 text-xs tabular-nums text-muted">{a.minutes} min</span> : null}
            </div>
          )) : <span className="text-sm text-ink2">Nothing runs alongside this one.</span>}
        </div>
      )}
    </div>
  );
}
