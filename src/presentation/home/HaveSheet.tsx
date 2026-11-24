"use client";
import { useEffect, useState } from "react";
import { useHave, type AskItem } from "@/view-models/pantry/useHave";
import { useSwipeDismiss } from "../shared/useSwipeDismiss";

/**
 * "Do you have these?" The pantry may be empty or wrong, so for the main ingredients it asks instead of guessing.
 * I have it -> the pantry gets it. Don't have -> it goes on the shopping list. Kitchen basics are assumed.
 */
export function HaveSheet({ dish, items, assumed, onClose }: { dish: string; items: AskItem[]; assumed: string[]; onClose: () => void }) {
  const h = useHave();
  const [answers, setAnswers] = useState<Record<string, "have" | "dont">>({});
  const { sheet, handle } = useSwipeDismiss(onClose);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const answer = async (i: AskItem, a: "have" | "dont") => {
    setAnswers((x) => ({ ...x, [i.name]: a }));
    await (a === "have" ? h.have(i) : h.dont(i));
  };
  const left = items.filter((i) => !answers[i.name]).length;
  const missing = items.filter((i) => answers[i.name] === "dont").length;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div ref={sheet} role="dialog" aria-modal="true" aria-label="Do you have these?" className="story-in relative mx-auto flex max-h-[88dvh] w-full max-w-[460px] flex-col gap-3 rounded-t-[28px] bg-bg px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-2.5">
        <div {...handle} className="flex touch-none flex-col gap-3">
          <span className="mx-auto block h-1 w-10 rounded-sm bg-line2" aria-hidden="true" />
          <div>
            <h2 className="m-0 text-xl font-medium">Do you have these?</h2>
            <p className="m-0 mt-1 text-sm text-ink2">For {dish}. Your pantry may be out of date, so tell me.</p>
          </div>
        </div>

        <ul className="m-0 flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0">
          {items.map((i) => {
            const a = answers[i.name];
            return (
              <li key={i.name} className="flex items-center gap-3 border-t border-line py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]">{i.name}</span>
                  <span className="block text-sm text-ink2">{i.qty} {i.unit}</span>
                </span>
                <button type="button" aria-pressed={a === "have"} aria-label={`I have ${i.name}`} onClick={() => void answer(i, "have")} className={`touch rounded-full border px-3.5 text-sm font-medium ${a === "have" ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg text-ink"}`}>I have it</button>
                <button type="button" aria-pressed={a === "dont"} aria-label={`Don't have ${i.name}`} onClick={() => void answer(i, "dont")} className={`touch rounded-full border px-3.5 text-sm font-medium ${a === "dont" ? "border-transparent bg-peach text-onp" : "border-line2 bg-bg text-ink"}`}>Don&apos;t have</button>
              </li>
            );
          })}
        </ul>

        {assumed.length > 0 && <p className="m-0 text-sm text-muted">Assuming you have {assumed.join(", ").toLowerCase()}.</p>}
        <button type="button" onClick={onClose} className="touch rounded-full bg-ink px-6 text-[15px] font-medium text-bg">
          {left > 0 ? "Done for now" : missing ? `Done · ${missing} on your shopping list` : "Done · ready to cook"}
        </button>
      </div>
    </div>
  );
}
