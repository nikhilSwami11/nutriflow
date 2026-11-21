"use client";
import Link from "next/link";
import { usePlan } from "@/view-models/plan/usePlan";
import { AppShell } from "../shell/AppShell";

const DOT = { ok: "bg-mint", under: "bg-butter", over: "bg-peach" } as const;
const WORD = { ok: "on goal", under: "under", over: "over" } as const;

export function PlanScreen() {
  const p = usePlan();
  return (
    <AppShell current="plan">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:px-2">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Plan</h1>
        {!p.isLoading && <p className="mt-1 text-[13px] text-muted">Built from the meals you already eat, aiming at {p.goals}.</p>}
      </header>
      {!p.isLoading && (
        <div className="rail flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 pt-1 lg:px-2">
          <div role="group" aria-label="Focus" className="relative grid w-fit grid-cols-2 rounded-full bg-track p-[3px]">
            <span aria-hidden="true" className="absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-full bg-bg shadow-[0_1px_5px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]" style={{ transform: p.focus === "protein" ? "translateX(100%)" : "none" }} />
            {(["balanced", "protein"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={p.focus === f} onClick={() => p.setFocus(f)} className={`relative z-10 min-h-9 min-w-[110px] rounded-full px-3.5 py-2 text-[13px] ${p.focus === f ? "font-medium text-ink" : "text-ink2"}`}>
                {f === "balanced" ? "Balanced" : "High protein"}
              </button>
            ))}
          </div>

          <section aria-label="Week balance" className="rounded-[20px] border border-line bg-bg p-4 lg:p-5">
            <div className="grid grid-cols-2 gap-4">
              {p.summary.map((s) => (
                <div key={s.label}>
                  <div className="text-xs text-muted">{s.label}</div>
                  <div className="mt-0.5 text-[22px] font-medium tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted">{s.goal}</div>
                </div>
              ))}
            </div>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1 border-t border-line p-0 pt-3 text-[13px] text-ink2" aria-label="Notes">
              {p.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </section>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {p.days.map((d, i) => (
              <section key={d.date} aria-label={`${d.name} plan`} className="rise flex flex-col rounded-[20px] border border-line bg-bg px-4 pb-1 pt-3.5" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                <div className="flex items-baseline justify-between">
                  <h2 className="m-0 text-[15px] font-medium">{d.name} <span className="text-xs font-normal text-muted">{d.sub}</span></h2>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-ink2">
                  <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${DOT[d.kcalStatus]}`} aria-hidden="true" />{d.kcal}<span className="sr-only"> {WORD[d.kcalStatus]}</span></span>
                  <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${DOT[d.proteinStatus]}`} aria-hidden="true" />{d.protein}<span className="sr-only"> {WORD[d.proteinStatus]}</span></span>
                </div>
                <div className="mt-2">
                  {d.meals.map((m) => (
                    <Link key={m.meal} href={`/recipes/${m.id}`} className="flex min-h-12 items-center gap-3 border-t border-line py-2">
                      <span className="h-8 w-8 shrink-0 rounded-[10px]" style={{ background: m.tint }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{m.name}</span>
                        <span className="block text-xs text-muted">{m.meal}</span>
                      </span>
                      <span className="text-right text-xs tabular-nums text-ink2">{m.kcal} kcal<br />{m.protein} g</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

        </div>
      )}
    </AppShell>
  );
}
