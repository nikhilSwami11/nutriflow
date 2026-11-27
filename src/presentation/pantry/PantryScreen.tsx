"use client";
import Image from "next/image";
import { useState } from "react";
import { usePantryScreen } from "@/view-models/pantry/usePantryScreen";
import { AppShell } from "../shell/AppShell";
import { tint } from "../shared/tint";
import { AddItemsSheet } from "./AddItemsSheet";
import { Skeleton } from "../shared/Skeleton";


/** Out of stock first, then low stock, then the rest. */
const rank = (r: { low: boolean; out: boolean }) => (r.out ? 2 : r.low ? 1 : 0);

export function PantryScreen() {
  const s = usePantryScreen();
  const [adding, setAdding] = useState(false);
  return (
    <AppShell current="pantry">
      <header className="flex shrink-0 items-end justify-between px-5 pb-2 pt-4 lg:max-w-3xl">
        <div>
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Pantry</h1>
          <p className="mt-1 text-sm text-muted tabular-nums">{s.countText}</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="touch rounded-full border border-line2 bg-transparent px-4 text-sm font-medium">
            Add manually
          </button>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
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

        {s.isLoading && <Skeleton />}
        {!s.isLoading && s.filterCounts.all === 0 && (
          <div className="flex flex-col gap-1 pt-2">
            <p className="m-0 text-[15px] font-medium">Your pantry is empty</p>
            <p className="m-0 max-w-[40ch] text-sm text-ink2">Tell me what you have, and meals, shopping and plans start from it.</p>
          </div>
        )}
        <ul aria-label="Pantry items" className="m-0 flex list-none flex-col p-0">
          {s.groups.flatMap((g) => g.rows).sort((a, b) => rank(b) - rank(a)).map((r) => (
            <li key={r.id} className="flex min-h-16 items-center gap-3 border-b border-line py-2">
              <div role="img" aria-label={r.name} className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${r.image ? "bg-panel" : tint(r.name)} ${r.out ? "opacity-50 grayscale" : ""}`}>
                {r.image ? <Image src={r.image} alt="" width={44} height={44} className="object-contain" /> : <span aria-hidden="true" className="text-lg font-medium text-onp">{r.name.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[15px] ${r.out ? "text-muted" : ""}`}>{r.name}</div>
                {r.low && <div className="text-xs text-muted">{r.out ? "Out of stock" : "Low stock"}</div>}
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" onClick={() => s.adjust(r.id, -1)} aria-label={`Less ${r.name}`} className="h-11 w-11 bg-transparent p-0 text-xl text-ink">&minus;</button>
                <span className="min-w-[52px] text-center text-sm tabular-nums">{r.qtyText}</span>
                <button type="button" onClick={() => s.adjust(r.id, 1)} aria-label={`More ${r.name}`} className="h-11 w-11 bg-transparent p-0 text-xl text-ink">+</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {adding && <AddItemsSheet onClose={() => setAdding(false)} />}
    </AppShell>
  );
}
