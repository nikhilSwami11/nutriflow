"use client";
import Link from "next/link";
import { useRecipes } from "@/view-models/recipes/useRecipes";
import { AppShell } from "../shell/AppShell";
import { Bowl } from "./Bowl";

export function RecipesScreen() {
  const r = useRecipes();
  return (
    <AppShell current="recipes">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:px-2">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Recipes</h1>
        {!r.isLoading && <p className="mt-1 text-sm text-muted">{r.ready}</p>}
      </header>
      {!r.isLoading && (
        <>
          <div className="flex shrink-0 flex-col gap-2.5 px-5 pb-2.5 pt-1 lg:px-2">
            <label className="relative block lg:max-w-md">
              <span className="absolute left-3.5 top-1/2 flex -translate-y-1/2 text-muted">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
              </span>
              <input type="text" value={r.query} onChange={(e) => r.setQuery(e.target.value)} aria-label="Search recipes" placeholder="Search recipes" autoComplete="off" className="min-h-[46px] w-full rounded-full border border-line2 bg-bg pl-[42px] pr-4 text-sm" />
            </label>
            <div role="group" aria-label="Filters" className="rail -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
              {r.filters.map((f) => (
                <button key={f.id} type="button" onClick={f.pick} aria-pressed={f.on} className={`touch shrink-0 rounded-full border px-4 text-sm ${f.on ? "border-transparent bg-mint text-onp" : "border-line2 bg-transparent text-ink"}`}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="rail min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-1.5 lg:px-2">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {r.cards.map((c, i) => (
                <Link key={c.id} href={`/recipes/${c.id}`} aria-label={c.name} className="rise hoverable flex flex-col gap-2 rounded-[20px] border border-line bg-bg p-2.5 transition-colors hover:border-ink" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                  <span className="flex h-[92px] items-center justify-center rounded-2xl" style={{ background: c.tint }}><Bowl /></span>
                  <span className="block w-full text-left">
                    <span className="block text-[15px] font-medium leading-tight">{c.name}</span>
                    <span className="mt-[3px] block text-xs text-muted tabular-nums">{c.meta}</span>
                  </span>
                  <span className={`self-start rounded-full px-2.5 py-[3px] text-xs font-medium text-onp ${c.ready ? "bg-mint" : "bg-peach"}`}>{c.chip}</span>
                </Link>
              ))}
            </div>
            {r.cards.length === 0 && <p className="mt-8 text-center text-sm text-muted">No recipes match.</p>}
          </div>
        </>
      )}
    </AppShell>
  );
}
