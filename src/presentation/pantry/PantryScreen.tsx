"use client";
import Image from "next/image";
import { useState } from "react";
import { usePantryScreen } from "@/view-models/pantry/usePantryScreen";
import { AppShell } from "../shell/AppShell";
import { tint } from "../shared/tint";
import { AddItemsSheet } from "./AddItemsSheet";
import { Skeleton } from "../shared/Skeleton";


export function PantryScreen() {
  const s = usePantryScreen();
  const [adding, setAdding] = useState(false);
  const rows = s.groups.flatMap((g) => g.rows);
  const inStock = rows.filter((r) => !r.out);
  const out = rows.filter((r) => r.out);
  return (
    <AppShell current="pantry">
      <header className="flex shrink-0 items-end justify-between gap-2 px-5 pb-2 pt-4 lg:max-w-3xl">
        <div>
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Pantry</h1>
          <p className="mt-1 text-sm text-muted tabular-nums">{s.countText}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={s.toggleEditing} aria-pressed={s.editing} className={`touch rounded-full border px-4 text-sm font-medium ${s.editing ? "border-transparent bg-mint text-onp" : "border-line2 bg-transparent"}`}>{s.editing ? "Done" : "Edit"}</button>
          <button type="button" onClick={() => setAdding(true)} aria-label="Add manually" className="touch rounded-full border border-line2 bg-transparent px-4 text-sm font-medium">Add</button>
        </div>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
        <form onSubmit={(e) => { e.preventDefault(); void s.typeAdd(); }} className="flex shrink-0 gap-2">
          <input value={s.typed} onChange={(e) => s.setTyped(e.target.value)} aria-label="Type what you have" placeholder="Type what you have, like 2 onions and milk" className="min-h-11 min-w-0 flex-1 rounded-full border border-line2 bg-bg px-4 text-[15px] text-ink placeholder:text-muted" />
          <button type="submit" aria-label="Add typed item" disabled={!s.typed.trim()} className="touch rounded-full border-0 bg-ink px-5 text-sm font-medium text-bg disabled:bg-track disabled:text-muted">Add</button>
        </form>
        {s.voice.added && <p role="status" className="m-0 -mt-2 text-sm text-ink2">{s.voice.added}</p>}

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
            <p className="m-0 max-w-[40ch] text-sm text-ink2">Add what you have, and meals, shopping and plans start from it.</p>
            <button type="button" onClick={() => setAdding(true)} className="touch mt-2 inline-flex items-center self-start rounded-full border-0 bg-ink px-5 text-[15px] font-medium text-bg">Add what you have</button>
          </div>
        )}

        {inStock.length > 0 && (
          <section aria-label="In stock" className="flex flex-col">
            <h2 className="m-0 mb-1 text-base font-medium">In stock <span className="text-sm font-normal text-muted">{inStock.length}</span></h2>
            <ul className="m-0 flex list-none flex-col p-0">{inStock.map((r) => <Row key={r.id} r={r} s={s} />)}</ul>
          </section>
        )}

        {out.length > 0 && (
          <section aria-label="Out of stock" className="flex flex-col">
            <h2 className="m-0 mb-1 text-base font-medium">Out of stock <span className="text-sm font-normal text-muted">{out.length}</span></h2>
            <ul className="m-0 flex list-none flex-col p-0">{out.map((r) => <Row key={r.id} r={r} s={s} />)}</ul>
          </section>
        )}

        {s.needed.length > 0 && (
          <section aria-label="Needed for your meals" className="flex flex-col">
            <h2 className="m-0 mb-1 text-base font-medium">Needed for your next meals <span className="text-sm font-normal text-muted">{s.needed.length}</span></h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {s.needed.map((n) => (
                <li key={n.name} className="flex min-h-16 items-center gap-3 border-b border-line py-2">
                  <div aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tint(n.name)}`}><span className="text-lg font-medium text-onp">{n.name.charAt(0).toUpperCase()}</span></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px]">{n.name}</div>
                    <div className="text-sm text-muted tabular-nums">{n.amount}</div>
                  </div>
                  <button type="button" onClick={() => void s.addToList(n.need)} className="touch rounded-full border border-line2 bg-transparent px-4 text-sm font-medium text-ink">Add to list</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      {adding && <AddItemsSheet onClose={() => setAdding(false)} />}
    </AppShell>
  );
}

type Row = ReturnType<typeof usePantryScreen>["groups"][number]["rows"][number];

/** One pantry item. View shows the amount; Edit shows steppers and Remove. An out item can go on the shopping list. */
function Row({ r, s }: { r: Row; s: ReturnType<typeof usePantryScreen> }) {
  return (
    <li className="flex min-h-16 items-center gap-3 border-b border-line py-2">
      <div role="img" aria-label={r.name} className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${r.image ? "bg-panel" : tint(r.name)} ${r.out ? "opacity-50 grayscale" : ""}`}>
        {r.image ? <Image src={r.image} alt="" width={44} height={44} className="object-contain" /> : <span aria-hidden="true" className="text-lg font-medium text-onp">{r.name.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-[15px] ${r.out ? "text-muted" : ""}`}>{r.name}</div>
        <div className="text-sm text-muted tabular-nums">{r.out ? "Out" : r.low ? `Low · ${r.qtyText}` : r.qtyText}</div>
      </div>
      {s.editing ? (
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => s.adjust(r.id, -1)} aria-label={`Less ${r.name}`} className="h-11 w-11 bg-transparent p-0 text-xl text-ink">&minus;</button>
          <span className="min-w-[44px] text-center text-sm tabular-nums">{r.qtyText}</span>
          <button type="button" onClick={() => s.adjust(r.id, 1)} aria-label={`More ${r.name}`} className="h-11 w-11 bg-transparent p-0 text-xl text-ink">+</button>
          <button type="button" onClick={() => s.remove(r.id)} aria-label={`Remove ${r.name}`} className="flex h-11 w-11 items-center justify-center bg-transparent p-0 text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      ) : r.out || r.low ? (
        <button type="button" disabled={r.onList} onClick={() => void s.addToList({ name: r.name })} className={`touch shrink-0 rounded-full border px-4 text-sm font-medium ${r.onList ? "border-transparent bg-mint text-onp" : "border-line2 bg-transparent text-ink"}`}>{r.onList ? "On the list" : "Add to list"}</button>
      ) : null}
    </li>
  );
}
