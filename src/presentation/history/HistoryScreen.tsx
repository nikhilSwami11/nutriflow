"use client";
import Link from "next/link";
import { useHistory, type HistoryCell } from "@/view-models/history/useHistory";
import { RecipeArt } from "../recipes/RecipeArt";
import { AppShell } from "../shell/AppShell";
import { Skeleton } from "../shared/Skeleton";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const arrow = (d: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const kcal = (n: number) => n.toLocaleString("en-US");

function Day({ c, selected, onPick }: { c: HistoryCell; selected: boolean; onPick: () => void }) {
  const dishes = c.meals.slice(0, 3);
  const label = `${c.date}${c.kcal === null ? ", nothing logged" : `, ${kcal(c.kcal)} kcal, ${c.meals.length} ${c.meals.length === 1 ? "meal" : "meals"}`}`;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={label}
      aria-pressed={selected}
      aria-current={c.today ? "date" : undefined}
      className={`flex min-h-[64px] flex-col items-center gap-1 rounded-2xl border p-1 ${selected ? "border-transparent bg-mint text-onp" : c.status === "out" ? "border-transparent bg-peach/40" : c.status === "in" ? "border-transparent bg-mint/30" : "border-line"} ${c.inMonth ? "" : "text-muted"}`}
    >
      <span className={`text-sm tabular-nums ${c.today ? "font-semibold underline underline-offset-4" : ""}`}>{c.day}</span>
      <span className="flex h-6 items-center justify-center -space-x-2">
        {dishes.map((m) => (
          <span key={m.id} className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-bg" style={{ background: m.tint }}>
            <RecipeArt image={m.image} size={22} />
          </span>
        ))}
      </span>
    </button>
  );
}

export function HistoryScreen() {
  const h = useHistory();
  return (
    <AppShell current="history">
      <header className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4 lg:max-w-3xl">
        <div className="flex items-center gap-1">
          <Link href="/profile" aria-label="Back to profile" className="-ml-3 flex h-11 w-11 items-center justify-center text-ink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </Link>
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">History</h1>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={h.prev} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-full border border-line2">{arrow("M15 5l-7 7 7 7")}</button>
          <span className="min-w-[132px] text-center text-[15px] font-medium">{h.title}</span>
          <button type="button" onClick={h.next} disabled={!h.canNext} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-full border border-line2 disabled:opacity-30">{arrow("M9 5l7 7-7 7")}</button>
        </div>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-2 lg:max-w-3xl">
        {h.isLoading ? <Skeleton rows={4} /> : (
          <>
            <div role="group" aria-label={h.title} className="grid grid-cols-7 gap-1.5">
              {DOW.map((d) => <span key={d} className="pb-1 text-center text-xs text-muted">{d}</span>)}
              {h.cells.map((c) => <Day key={c.date} c={c} selected={c.date === h.selected} onPick={() => h.pick(c.date)} />)}
            </div>

            <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-mint" />In your range ({kcal(h.range.min)} to {kcal(h.range.max)})</span>
              <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-peach" />Outside it</span>
            </p>

            <section aria-label={h.selectedTitle} className="flex flex-col gap-2 rounded-[20px] bg-panel p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="m-0 text-base font-medium">{h.selectedTitle}</h2>
                {h.selectedKcal !== null && <span className="text-sm tabular-nums text-ink2">{kcal(h.selectedKcal)} kcal</span>}
              </div>
              {h.selectedMeals.length === 0 ? (
                <p className="m-0 text-sm text-ink2">{h.empty ? "Your history starts with your first meal. Cook something or log what you ate and it will appear here." : "Nothing logged this day."}</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {h.selectedMeals.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ background: m.tint }}><RecipeArt image={m.image} size={52} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{m.name}</span>
                        <span className="block text-sm text-ink2">{m.slot}</span>
                      </span>
                      <span className="text-sm tabular-nums text-ink2">{kcal(m.kcal)} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
