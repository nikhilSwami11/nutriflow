"use client";
import Link from "next/link";
import { usePantryScreen } from "@/view-models/pantry/usePantryScreen";
import { AppShell } from "../shell/AppShell";
import { tint } from "../shared/tint";
import { Orb } from "./Orb";


export function PantryScreen() {
  const s = usePantryScreen();
  const v = s.voice;
  const listening = v.mode === "listening";

  const title = listening ? "Listening" : v.mode === "heard" ? "I heard" : "Tell me what you have";
  const sub = listening
    ? "Go ahead, I am listening."
    : v.mode === "heard"
      ? `“${v.heardText}”`
      : "Say it like “I have 3 onions, 2 tomatoes and butter”.";

  return (
    <AppShell current="pantry">
      <header className="flex shrink-0 items-end justify-between px-5 pb-2 pt-4 lg:max-w-3xl">
        <div>
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Pantry</h1>
          <p className="mt-1 text-sm text-muted tabular-nums">{s.countText}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/shopping" className="touch inline-flex items-center rounded-full border border-line2 px-4 text-sm font-medium">Shopping list</Link>
          <button type="button" className="touch rounded-full border border-line2 bg-transparent px-4 text-sm font-medium">
            Add manually
          </button>
        </div>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
        <div className="flex shrink-0 flex-col gap-3.5 rounded-3xl bg-panel p-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={v.tapMic}
              aria-label="Tell me what you have"
              aria-pressed={listening}
              className="relative flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-ink p-0 text-bg"
            >
              <Orb active={listening} />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium">{title}</div>
              <div className="mt-0.5 text-sm leading-[1.4] text-ink2">{sub}</div>
            </div>
          </div>
          {v.mode === "heard" && (
            <>
              <div className="flex flex-wrap gap-2">
                {v.heardChips.map((c) => (
                  <span key={c.name} className="rounded-full border border-line2 bg-bg px-3.5 py-[7px] text-sm">
                    <span className="font-medium">{c.name}</span> <span className="text-muted">{c.qty}</span>
                  </span>
                ))}
              </div>
              <div className="flex gap-2.5">
                <button type="button" onClick={v.addHeard} className="min-h-12 flex-1 rounded-full bg-ink text-sm font-medium text-bg">
                  Add to pantry
                </button>
                <button type="button" onClick={v.redo} className="min-h-12 rounded-full border border-line2 bg-transparent px-[18px] text-sm text-ink">
                  Redo
                </button>
              </div>
            </>
          )}
          {v.added && v.mode === "idle" && (
            <div role="status" className="rounded-2xl bg-mint px-3.5 py-2.5 text-sm font-medium text-onp">{v.added}</div>
          )}
        </div>

        {s.lowCount > 0 && (
          <button
            type="button"
            onClick={s.toggleList}
            aria-pressed={s.listed}
            className={`flex w-full shrink-0 items-center justify-between gap-3 rounded-[20px] px-4 py-3.5 text-ink transition-colors active:scale-[.97] ${s.listed ? "border border-transparent bg-mint" : "border border-line2 bg-bg"}`}
          >
            <span className="text-left">
              <span className="block text-sm font-medium">{s.lowCount} running low</span>
              <span className="mt-0.5 block text-xs opacity-75">{s.lowSub}</span>
            </span>
            <span className={`shrink-0 rounded-full px-3.5 py-[7px] text-xs font-medium ${s.listed ? "bg-ink text-bg" : "bg-peach text-onp"}`}>
              {s.listed ? "On the list" : "Add to list"}
            </span>
          </button>
        )}

        <div role="group" aria-label="Filter" className="flex gap-[22px] border-b border-line">
          {(["all", "low"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={s.filter === f}
              onClick={() => s.setFilter(f)}
              className={`touch border-0 border-b-[1.5px] bg-transparent px-0.5 text-[15px] ${s.filter === f ? "border-ink font-medium text-ink" : "border-transparent font-normal text-muted"}`}
            >
              {f === "all" ? `All ${s.filterCounts.all}` : `Running low ${s.filterCounts.low}`}
            </button>
          ))}
        </div>

        {s.groups.map((g) => (
          <section key={g.name} aria-label={g.name} className="flex flex-col">
            <h2 className="mb-1 mt-0 text-sm font-medium text-muted">{g.name}</h2>
            {g.rows.map((r) => (
              <div key={r.id} className="flex min-h-16 items-center gap-3 border-b border-line py-2">
                <div role="img" aria-label={r.name} className={`h-12 w-12 shrink-0 rounded-2xl ${tint(r.name)}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px]">{r.name}</span>
                    {r.low && <span className="rounded-full bg-peach px-[9px] py-0.5 text-xs font-medium text-onp">Low</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <button type="button" onClick={() => s.adjust(r.id, -1)} aria-label={`Less ${r.name}`} className="h-11 w-11 bg-transparent p-0 text-xl text-ink">&minus;</button>
                  <span className="min-w-[52px] text-center text-sm tabular-nums">{r.qtyText}</span>
                  <button type="button" onClick={() => s.adjust(r.id, 1)} aria-label={`More ${r.name}`} className="h-11 w-11 bg-transparent p-0 text-xl text-ink">+</button>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </AppShell>
  );
}
