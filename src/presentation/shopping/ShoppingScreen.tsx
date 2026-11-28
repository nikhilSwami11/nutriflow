"use client";
import Link from "next/link";
import { useState } from "react";
import { isZip, STORES, useShopping, type ShoppingRow, type StoreId } from "@/view-models/shopping/useShopping";
import { AppShell } from "../shell/AppShell";
import { Skeleton } from "../shared/Skeleton";

const HOLD = 350; // ms: a ticked row stays green this long...
const SLIDE = 300; // ...then folds away this long, before it counts as shopped

const Check = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

/** Folds shut by sliding its height to 0, so rows move up smoothly. Text never fades. */
function Fold({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid transition-[grid-template-rows,visibility] duration-300 ease-out ${open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

// Glyph buttons: small to look at, 44px to tap.
const glyph = "touch flex w-11 items-center justify-center border-0 bg-transparent p-0 text-xl text-ink2 disabled:text-line2";

function ToBuyRow({ r, onShopped, onQty }: { r: ShoppingRow; onShopped: (id: string) => void; onQty: (id: string, qty: number) => void }) {
  const [stage, setStage] = useState<"idle" | "green" | "gone">("idle");
  const tick = () => {
    if (stage !== "idle") return;
    setStage("green");
    setTimeout(() => setStage("gone"), HOLD);
    setTimeout(() => onShopped(r.id), HOLD + SLIDE);
  };
  return (
    <li>
      <Fold open={stage !== "gone"}>
        <div className={`flex items-center border-b border-line transition-colors duration-300 ${stage === "idle" ? "bg-bg" : "bg-mint"}`}>
          <button type="button" onClick={tick} aria-label={`${r.name}, tap when shopped`} className="touch flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent p-0 text-left text-onp">
            <span className={`ml-5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-onp ${stage === "idle" ? "border-line2" : "border-transparent bg-onp text-bg"}`} aria-hidden="true">
              {stage !== "idle" && <Check size={12} />}
            </span>
            <span className="min-w-0 flex-1 py-2.5">
              <span className="block text-[15px] text-ink">{r.name}</span>
              {r.storeUrl && <span className="block text-sm text-muted">{r.storeName}</span>}
            </span>
          </button>
          {r.storeUrl && (
            <a href={r.storeUrl} target="_blank" rel="noopener noreferrer" aria-label={`Find ${r.name} at ${r.storeName}`} className="touch flex w-9 shrink-0 items-center justify-center text-ink2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </a>
          )}
          <div className="flex shrink-0 items-center pr-2" role="group" aria-label={`How much ${r.name}`}>
            <button type="button" onClick={() => onQty(r.id, r.qty - r.step)} disabled={!r.canLess} aria-label={`Less ${r.name}`} className={glyph}>&minus;</button>
            <span className="min-w-12 text-center text-[15px] tabular-nums text-ink" aria-live="polite">{r.amountText}</span>
            <button type="button" onClick={() => onQty(r.id, r.qty + r.step)} aria-label={`More ${r.name}`} className={glyph}>+</button>
          </div>
        </div>
      </Fold>
    </li>
  );
}

export function ShoppingScreen() {
  const s = useShopping();
  const [editing, setEditing] = useState(false);
  const [item, setItem] = useState("");
  const [shown, setShown] = useState(false);
  const [zip, setZip] = useState("");
  const [store, setStore] = useState<StoreId>("walmart");
  const n = s.boughtRows.length;
  const total = n + s.rows.length;

  return (
    <AppShell current="shopping">
      <header className="flex shrink-0 items-end justify-between px-5 pb-2 pt-4 lg:max-w-3xl">
        <div>
          <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Shopping</h1>
          <p className="mt-1 text-sm text-muted tabular-nums">{s.countText}</p>
        </div>
        <div className="flex items-center">
          {!editing && !s.isLoading && (
            <button
              type="button"
              onClick={() => {
                setZip(s.prefs?.zip ?? "");
                setStore(s.prefs?.store ?? "walmart");
                setEditing(true);
              }}
              className="touch border-0 bg-transparent px-2 text-sm text-ink2"
            >
              {s.prefs ? `${s.storeName} · ${s.prefs.zip}` : "Choose a store"}
            </button>
          )}
        </div>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto pb-4 lg:max-w-3xl">
        {editing && (
          <form
            className="mx-5 flex shrink-0 flex-col gap-3 rounded-[20px] bg-panel p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isZip(zip)) return;
              s.savePrefs(zip, store);
              setEditing(false);
            }}
          >
            <h2 className="m-0 text-base font-medium">Where do you shop?</h2>
            <label htmlFor="zip" className="text-[15px] font-medium">ZIP code</label>
            <input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric" autoComplete="postal-code" placeholder="94103" maxLength={5} className="touch rounded-2xl border border-line2 bg-bg px-4 text-[15px]" />
            <div role="group" aria-label="Store" className="flex flex-wrap gap-2">
              {STORES.map((x) => (
                <button key={x.id} type="button" aria-pressed={store === x.id} onClick={() => setStore(x.id)} className={`touch rounded-full border px-4 text-sm font-medium ${store === x.id ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg"}`}>
                  {x.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={!isZip(zip)} className="touch rounded-full border-0 bg-ink px-5 text-[15px] font-medium text-bg disabled:bg-track disabled:text-muted">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="touch rounded-full border border-line2 bg-transparent px-5 text-[15px] font-medium">Cancel</button>
            </div>
          </form>
        )}

        {total > 0 && (
          <button type="button" onClick={() => setShown(!shown)} disabled={n === 0} aria-expanded={shown} aria-label={`${n} of ${total} shopped`} className="touch mx-5 flex shrink-0 items-center gap-3 border-0 bg-transparent p-0 text-left disabled:cursor-default">
            <span className="flex h-2.5 min-w-0 flex-1 gap-1" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <span key={`${i}-${i < n}`} className={`h-full flex-1 rounded-[3px] ${i < n ? "pop bg-mint" : "bg-line2"}`} />
              ))}
            </span>
            <span className="shrink-0 text-sm tabular-nums text-ink2">{n} of {total}</span>
          </button>
        )}

        <section aria-label="Shopped">
          <Fold open={shown && n > 0}>
            <div className="mx-5 mb-1 rounded-[20px] bg-mint px-4 py-2 text-onp">
              <ul className="m-0 list-none p-0">
                {s.boughtRows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 py-2 text-[15px] line-through">
                      {r.name} <span className="text-sm no-underline">{r.amountText}</span>
                    </span>
                    <button type="button" onClick={() => s.undo(r.id)} aria-label={`Undo ${r.name}`} className="touch shrink-0 border-0 bg-transparent px-1 text-sm text-onp underline underline-offset-[3px]">Undo</button>
                  </li>
                ))}
              </ul>
              <p className="m-0 pb-1 text-sm">Kept here for 12 hours, and in your pantry.</p>
            </div>
          </Fold>
        </section>

        {!s.isLoading && !editing && (
          <form
            className="mx-5 flex shrink-0 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void s.addByName(item).then(() => setItem(""));
            }}
          >
            <input value={item} onChange={(e) => setItem(e.target.value)} aria-label="Add an item" placeholder="Add an item" autoComplete="off" maxLength={60} className="touch min-w-0 flex-1 rounded-full border border-line2 bg-bg px-4 text-[15px]" />
            <button type="submit" disabled={!item.trim()} className="touch shrink-0 rounded-full bg-ink px-5 text-[15px] font-medium text-bg disabled:opacity-40">Add</button>
          </form>
        )}

        {!s.isLoading && !editing && s.week && (
          <button type="button" onClick={() => void s.week?.add()} className="touch mx-5 shrink-0 self-start rounded-full border border-line2 bg-transparent px-4 text-sm font-medium text-ink">Add the whole week · {s.week.count} more</button>
        )}

        {s.isLoading && s.rows.length === 0 && <Skeleton />}
        {s.rows.length > 0 && (
          <section aria-label="To buy">
            <ul className="m-0 list-none border-t border-line p-0">
              {s.rows.map((r) => (
                <ToBuyRow key={r.id} r={r} onShopped={s.buy} onQty={s.setQty} />
              ))}
            </ul>
          </section>
        )}

        {!s.isLoading && s.rows.length === 0 && n === 0 && s.pantryEmpty && (
          <div className="flex flex-col items-start gap-3 px-5">
            <p className="m-0 text-[15px] font-medium">Start with your pantry</p>
            <p className="m-0 max-w-[40ch] text-sm text-ink2">Once I know what you have, what your meals need lands here by itself.</p>
            <Link href="/pantry" className="touch inline-flex items-center rounded-full bg-ink px-5 text-[15px] font-medium text-bg">Add what you have</Link>
          </div>
        )}
        {!s.isLoading && s.rows.length === 0 && n === 0 && !s.pantryEmpty && (
          <p className="m-0 px-5 text-sm text-ink2">Nothing needed for your next few days. What you are missing or running low on lands here by itself.</p>
        )}
      </div>
    </AppShell>
  );
}
