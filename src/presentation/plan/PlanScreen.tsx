"use client";
import Link from "next/link";
import { useRef } from "react";
import { usePlan } from "@/view-models/plan/usePlan";
import { AppShell } from "../shell/AppShell";
import { Skeleton } from "../shared/Skeleton";
import { RecipeArt } from "../recipes/RecipeArt";

const DOT = { ok: "bg-mint", under: "bg-butter", over: "bg-peach" } as const;
const WORD = { ok: "on goal", under: "under", over: "over" } as const;

/** Today first. The other days are one tap away in the strip, one open at a time. */
export function PlanScreen() {
  const p = usePlan();
  const tabs = useRef<HTMLDivElement>(null);

  const move = (e: React.KeyboardEvent, count: number, at: number) => {
    const to = e.key === "ArrowRight" ? Math.min(count - 1, at + 1) : e.key === "ArrowLeft" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? count - 1 : null;
    if (to === null) return;
    e.preventDefault();
    if (!p.isLoading) p.select(to);
    tabs.current?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus();
  };

  return (
    <AppShell current="plan">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:px-2">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Plan</h1>
        {!p.isLoading && <p className="mt-1 text-sm text-muted">{p.fromHistory ? "Built from the meals you already eat" : "Picked to fit your diet"}, aiming at {p.goals}.</p>}
      </header>
      {p.isLoading && <Skeleton />}
      {!p.isLoading && (
        <div className="rail flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 pt-1 lg:grid lg:grid-cols-12 lg:content-start lg:px-2">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="relative grid w-fit grid-cols-2 rounded-full bg-track p-[3px]" role="group" aria-label="Focus">
              <span aria-hidden="true" className="absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-full bg-bg shadow-[0_1px_5px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]" style={{ transform: p.focus === "protein" ? "translateX(100%)" : "none" }} />
              {(["balanced", "protein"] as const).map((f) => (
                <button key={f} type="button" aria-pressed={p.focus === f} onClick={() => p.setFocus(f)} className={`relative z-10 min-h-11 min-w-[110px] rounded-full px-3.5 py-2 text-sm ${p.focus === f ? "font-medium text-ink" : "text-ink2"}`}>
                  {f === "balanced" ? "Balanced" : "High protein"}
                </button>
              ))}
            </div>

            <p className="m-0 text-sm text-muted">{p.focus === "protein" ? "Picks more protein-rich dishes." : "Picks dishes to stay near your calorie range."}</p>

            <div ref={tabs} role="tablist" aria-label="Day" className="rail -mx-5 flex gap-2 overflow-x-auto px-5 py-1 lg:mx-0 lg:px-0">
              {p.days.map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  role="tab"
                  id={`day-${i}`}
                  aria-selected={p.selected === i}
                  aria-controls="day-panel"
                  tabIndex={p.selected === i ? 0 : -1}
                  onClick={() => p.select(i)}
                  onKeyDown={(e) => move(e, p.days.length, i)}
                  className={`flex min-h-[64px] w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border text-xs transition-colors ${p.selected === i ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg text-ink2 hover:border-ink"}`}
                >
                  <span>{d.short}</span>
                  <span className="text-base font-medium tabular-nums">{d.dayNumber}</span>
                  <span className="flex gap-1" aria-hidden="true">
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[d.kcalStatus]}`} />
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[d.proteinStatus]}`} />
                  </span>
                </button>
              ))}
            </div>

            {p.days.map((d, i) =>
              p.selected !== i ? null : (
                <section key={d.date} id="day-panel" role="tabpanel" aria-labelledby={`day-${i}`} aria-label={`${d.name} plan`} className="fade-in flex flex-col rounded-[20px] border border-line bg-bg px-4 pb-1 pt-4 lg:px-5">
                  <h2 className="m-0 text-lg font-medium">{d.name} <span className="text-sm font-normal text-muted">{d.sub}</span></h2>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums text-ink2">
                    <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${DOT[d.kcalStatus]}`} aria-hidden="true" />{d.kcal}<span className="sr-only"> {WORD[d.kcalStatus]}</span></span>
                    <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${DOT[d.proteinStatus]}`} aria-hidden="true" />{d.protein}<span className="sr-only"> {WORD[d.proteinStatus]}</span></span>
                  </div>
                  <div className="mt-3">
                    {d.meals.map((m) => (
                      <Link key={m.meal} href={`/recipes/${m.id}`} className="flex min-h-14 items-center gap-3 border-t border-line py-2.5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: m.tint }} aria-hidden="true"><RecipeArt image={m.image} size={44} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px]">{m.name}</span>
                          <span className="block text-xs text-muted">{m.meal}</span>
                        </span>
                        <span className="text-right text-xs tabular-nums text-ink2">{m.kcal} kcal<br />{m.protein} g protein</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>

          <section aria-label="Week balance" className="h-fit rounded-[20px] border border-line bg-bg p-4 lg:col-span-5 lg:p-5">
            <h2 className="m-0 mb-3 text-sm font-medium">This week</h2>
            <div className="grid grid-cols-2 gap-4">
              {p.summary.map((s) => (
                <div key={s.label}>
                  <div className="text-xs text-muted">{s.label}</div>
                  <div className="mt-0.5 text-xl font-medium tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted">{s.goal}</div>
                </div>
              ))}
            </div>
            <ul className="m-0 mt-3 flex list-none flex-col gap-1 border-t border-line p-0 pt-3 text-sm text-ink2" aria-label="Notes">
              {p.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
            {p.canFixProtein && <button type="button" onClick={() => p.setFocus("protein")} className="touch mt-3 rounded-full border-0 bg-ink px-5 text-sm font-medium text-bg">Fix it: plan for protein</button>}
          </section>
        </div>
      )}
    </AppShell>
  );
}
