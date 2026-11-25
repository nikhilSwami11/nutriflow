"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAddItems } from "@/view-models/pantry/useAddItems";
import { copyOrSaveImage, listImage, mailtoHref } from "../shared/exportList";
import { tint } from "../shared/tint";
import { useSwipeDismiss } from "../shared/useSwipeDismiss";

const TITLE = "Shopping list";

/** Square tiles to select (a picture when we have one, else a colour and the first letter). Add them, or export the selection. */
export function AddItemsSheet({ onClose }: { onClose: () => void }) {
  const a = useAddItems();
  const { sheet, handle } = useSwipeDismiss(onClose);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyText = async () => {
    try { await navigator.clipboard.writeText(a.text); setNote("Copied the list."); } catch { setNote("Your browser would not copy. Try the image or email."); }
  };
  const image = async () => {
    const b = await listImage(TITLE, a.names);
    if (!b) return setNote("Could not draw the image.");
    setNote((await copyOrSaveImage(b, "shopping-list")) === "copied" ? "Copied the image." : "Saved the image.");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div ref={sheet} role="dialog" aria-modal="true" aria-label="Add items" className="story-in relative mx-auto flex max-h-[92dvh] w-full max-w-[520px] flex-col gap-3 rounded-t-[28px] bg-bg px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-2.5">
        <div {...handle} className="flex touch-none flex-col gap-3">
          <span className="mx-auto block h-1 w-10 rounded-sm bg-line2" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-xl font-medium">Add items</h2>
            <button type="button" onClick={onClose} aria-label="Close sheet" className="flex h-11 w-11 items-center justify-center rounded-full bg-track">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
        <input value={a.query} onChange={(e) => a.setQuery(e.target.value)} aria-label="Search items" placeholder="Search" className="min-h-11 rounded-full bg-panel px-4 text-[15px] text-ink placeholder:text-muted" />

        <ul aria-label="Items" className="m-0 grid min-h-0 flex-1 list-none grid-cols-3 gap-2.5 overflow-y-auto p-0 sm:grid-cols-4">
          {a.tiles.map((t) => (
            <li key={t.name}>
              <button type="button" aria-pressed={t.selected} aria-label={t.name} onClick={() => a.toggle(t.name)} className={`relative flex aspect-square w-full flex-col items-center justify-end gap-1 overflow-hidden rounded-2xl border p-2 ${t.selected ? "border-ink" : "border-transparent"} ${t.image ? "bg-panel" : tint(t.name)}`}>
                {t.image ? <Image src={t.image} alt="" width={64} height={64} className="object-contain" /> : <span aria-hidden="true" className="text-[28px] font-medium leading-none text-onp">{t.name[0]}</span>}
                <span aria-hidden="true" className="text-sm leading-tight text-onp">{t.name}</span>
                <span aria-hidden="true" className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border-2 ${t.selected ? "border-ink bg-ink text-bg" : "border-onp/40 bg-bg/70"}`}>
                  {t.selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                </span>
              </button>
            </li>
          ))}
          {a.tiles.length === 0 && <li className="col-span-full text-sm text-ink2">Nothing matches. Use “Tell me what you have” for anything else.</li>}
        </ul>

        {a.count > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Export the selection">
            <span className="text-sm text-ink2">Export {a.count}:</span>
            <button type="button" onClick={() => void copyText()} className="touch rounded-full border border-line2 bg-bg px-4 text-sm font-medium">Copy list</button>
            <a href={mailtoHref(TITLE, a.text)} className="touch inline-flex items-center rounded-full border border-line2 bg-bg px-4 text-sm font-medium text-ink">Email</a>
            <button type="button" onClick={() => void image()} className="touch rounded-full border border-line2 bg-bg px-4 text-sm font-medium">Image</button>
          </div>
        )}
        {note && <p role="status" className="m-0 text-sm text-ink2">{note}</p>}
        <button type="button" disabled={a.count === 0} onClick={async () => { await a.add(); setNote(null); onClose(); }} className="touch rounded-full bg-ink px-6 text-[15px] font-medium text-bg disabled:bg-track disabled:text-muted">{a.count ? `Add ${a.count} to pantry` : "Select what you have"}</button>
      </div>
    </div>
  );
}
