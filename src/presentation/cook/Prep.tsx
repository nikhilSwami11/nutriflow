import { useState } from "react";
import type { CookModel } from "@/view-models/cook/useCook";
import { ProcessCards } from "./ProcessCards";


/** Before the first step: set things out, and see what to use if something is missing. */
export function Prep({ c }: { c: CookModel }) {
  const p = c.prep;
  const [view, setView] = useState<"plan" | "setout">("plan");
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2">
        <h2 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Get ready</h2>
        <p className="m-0 mt-1 text-[15px] leading-normal text-ink2">Set these out before you start. About {p.minutes} minutes for {p.servings} servings.</p>

        <div role="group" aria-label="View" className="mt-3 flex gap-0.5 self-start rounded-full bg-track p-[3px]">
          {(["plan", "setout"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`min-h-11 rounded-full px-4 text-sm ${view === v ? "bg-bg font-medium text-ink shadow-[0_1px_5px_rgba(0,0,0,0.10)]" : "text-ink2"}`}>{v === "plan" ? "Plan" : "Set out"}</button>
          ))}
        </div>

        {view === "plan" && <div className="mt-3"><ProcessCards tiles={p.process} /></div>}

        {view === "setout" && <>
        <ul aria-label="Set out" className="m-0 mt-2 list-none p-0">
          {p.items.map((i) => (
            <li key={i.id} className="border-t border-line">
              <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
                <input type="checkbox" checked={i.checked} onChange={i.toggle} className="peer sr-only" />
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-line2 text-bg transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                <span className={`text-[15px] leading-snug transition-colors ${i.checked ? "text-muted line-through" : ""}`}>{i.text}</span>
              </label>
            </li>
          ))}
        </ul>
        <p role="status" className="m-0 mt-2 text-sm text-muted tabular-nums">{p.done} of {p.total} set out</p>

        {p.missing.length > 0 && (
          <section aria-label="Not in your pantry" className="mt-5 rounded-[20px] bg-panel p-4">
            <h3 className="m-0 text-base font-medium">Not in your pantry</h3>
            <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
              {p.missing.map((m) => (
                <li key={m.name} className="text-[15px] leading-snug">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-ink2">{m.swap ? `: use ${m.swap}` : ""}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        </>}
      </div>
      <div className="shrink-0 border-t border-line px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <button type="button" onClick={p.start} className="min-h-[52px] w-full rounded-full bg-ink px-6 text-[15px] font-medium text-bg">Start cooking</button>
      </div>
    </>
  );
}
