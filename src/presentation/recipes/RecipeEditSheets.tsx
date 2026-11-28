"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CHANGE_IDEAS, toDraft, useRecipeEdit, type DraftRecipe, type Recipe } from "@/view-models/recipes/useRecipeEdit";
import { useSwipeDismiss } from "../shared/useSwipeDismiss";

const field = "min-h-11 min-w-0 rounded-2xl border border-line2 bg-bg px-3 text-[15px]";

function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const { sheet, handle } = useSwipeDismiss(onClose);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  // In the body, not where it is opened: an animated parent would turn "fixed" into "inside the card".
  return createPortal(
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button type="button" tabIndex={-1} aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div ref={sheet} role="dialog" aria-modal="true" aria-label={label} className="story-in relative mx-auto flex max-h-[90dvh] w-full max-w-[460px] flex-col rounded-t-[28px] bg-bg pb-[max(20px,env(safe-area-inset-bottom))] pt-2.5">
        <div {...handle} className="touch-none">
          <span className="mx-auto block h-1 w-10 rounded-sm bg-line2" aria-hidden="true" />
          <div className="flex items-center justify-between px-5 pb-2 pt-2">
            <h2 className="m-0 text-xl font-medium">{label}</h2>
            <button type="button" onClick={onClose} aria-label="Close sheet" className="flex h-11 w-11 items-center justify-center rounded-full bg-track">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Ask AI to change the recipe ("no onion", "for 4"). The changed version opens unsaved; the bookmark keeps it. */
export function AskAiSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const edit = useRecipeEdit(recipe);
  const router = useRouter();
  const [text, setText] = useState("");
  const go = async (q: string) => {
    const id = await edit.askAi(q);
    if (id) {
      onClose();
      router.push(`/recipes/${id}`);
    }
  };
  return (
    <Sheet label="Ask AI to change it" onClose={onClose}>
      <div className="flex flex-col gap-3 px-5">
        <p className="m-0 text-sm text-ink2">Say what to change in {recipe.name}. You see the new version first and keep it or not.</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Ideas">
          {CHANGE_IDEAS.map((q) => (
            <button key={q} type="button" disabled={edit.busy} onClick={() => void go(q)} className="touch rounded-full border border-line2 px-4 text-sm disabled:opacity-40">{q}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void go(text); }} className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="What to change" placeholder="For example: no garlic, vegan" autoComplete="off" maxLength={200} className={`${field} flex-1 rounded-full px-4`} />
          <button type="submit" disabled={edit.busy || !text.trim()} className="min-h-12 shrink-0 rounded-full bg-ink px-5 text-[15px] font-medium text-bg disabled:opacity-40">{edit.busy ? "Changing" : "Change"}</button>
        </form>
        <p role="status" className="m-0 min-h-5 text-sm text-ink2">{edit.busy ? "Rewriting the recipe. A few seconds." : edit.error}</p>
      </div>
    </Sheet>
  );
}

/** Edit by hand: name, servings, ingredients, steps. A built-in recipe is saved as your own copy. */
export function EditRecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const edit = useRecipeEdit(recipe);
  const router = useRouter();
  const [d, setD] = useState<DraftRecipe>(() => toDraft(recipe));
  const setIng = (i: number, p: Partial<DraftRecipe["ingredients"][number]>) => setD((x) => ({ ...x, ingredients: x.ingredients.map((v, k) => (k === i ? { ...v, ...p } : v)) }));
  const setStep = (i: number, text: string) => setD((x) => ({ ...x, steps: x.steps.map((v, k) => (k === i ? { ...v, text } : v)) }));
  const save = async () => {
    const id = await edit.save({ ...d, ingredients: d.ingredients.filter((i) => i.name.trim()), steps: d.steps.filter((s) => s.text.trim()) });
    if (id) {
      onClose();
      router.push(`/recipes/${id}`);
    }
  };
  return (
    <Sheet label="Edit recipe" onClose={onClose}>
      <div className="rail flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-3">
        <label className="flex flex-col gap-1 text-sm text-ink2">Name
          <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={80} className={`${field} text-ink`} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink2">Servings
          <input type="number" inputMode="numeric" min={1} max={12} value={d.servings} onChange={(e) => setD({ ...d, servings: Number(e.target.value) })} className={`${field} w-28 text-ink`} />
        </label>
        <section aria-label="Ingredients" className="flex flex-col gap-2">
          <h3 className="m-0 text-base font-medium">Ingredients</h3>
          {d.ingredients.map((i, k) => (
            <div key={k} className="flex items-center gap-2">
              <input aria-label={`Ingredient ${k + 1}`} value={i.name} onChange={(e) => setIng(k, { name: e.target.value })} className={`${field} flex-1`} />
              <input aria-label={`Amount of ${i.name || "ingredient"}`} type="number" inputMode="decimal" min={0} value={i.qty} onChange={(e) => setIng(k, { qty: Number(e.target.value) })} className={`${field} w-[72px]`} />
              <input aria-label={`Unit of ${i.name || "ingredient"}`} value={i.unit} onChange={(e) => setIng(k, { unit: e.target.value })} className={`${field} w-[68px]`} />
              <button type="button" aria-label={`Remove ${i.name || "ingredient"}`} onClick={() => setD({ ...d, ingredients: d.ingredients.filter((_, n) => n !== k) })} className="flex h-11 w-11 shrink-0 items-center justify-center bg-transparent text-ink2">&times;</button>
            </div>
          ))}
          <button type="button" onClick={() => setD({ ...d, ingredients: [...d.ingredients, { name: "", qty: 1, unit: "pcs" }] })} className="touch self-start rounded-full border border-line2 px-4 text-sm">Add ingredient</button>
        </section>
        <section aria-label="Steps" className="flex flex-col gap-2">
          <h3 className="m-0 text-base font-medium">Steps</h3>
          {d.steps.map((s, k) => (
            <div key={k} className="flex items-start gap-2">
              <span className="mt-3 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-panel text-xs tabular-nums">{k + 1}</span>
              <textarea aria-label={`Step ${k + 1}`} value={s.text} onChange={(e) => setStep(k, e.target.value)} rows={2} className={`${field} flex-1 py-2.5`} />
              <button type="button" aria-label={`Remove step ${k + 1}`} onClick={() => setD({ ...d, steps: d.steps.filter((_, n) => n !== k) })} className="flex h-11 w-11 shrink-0 items-center justify-center bg-transparent text-ink2">&times;</button>
            </div>
          ))}
          <button type="button" onClick={() => setD({ ...d, steps: [...d.steps, { text: "", verb: "Stir" }] })} className="touch self-start rounded-full border border-line2 px-4 text-sm">Add step</button>
        </section>
      </div>
      <div className="px-5 pt-2">
        <p role="status" className="m-0 mb-2 min-h-5 text-sm text-ink2">{edit.error}</p>
        <button type="button" disabled={edit.busy} onClick={() => void save()} className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink text-[15px] font-medium text-bg disabled:opacity-40">{edit.busy ? "Saving" : "Save recipe"}</button>
      </div>
    </Sheet>
  );
}
