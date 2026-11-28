"use client";
import Link from "next/link";
import { useState } from "react";
import { useRecipe } from "@/view-models/recipes/useRecipes";
import { useRecipeEdit } from "@/view-models/recipes/useRecipeEdit";
import { AppShell } from "../shell/AppShell";
import { RecipeArt } from "./RecipeArt";
import { AskAiSheet, EditRecipeSheet } from "./RecipeEditSheets";
import { Skeleton } from "../shared/Skeleton";

import { verbColor } from "../shared/verbColor";

/** Edit and Ask AI for a loaded recipe. */
function EditBar({ recipe }: { recipe: Parameters<typeof useRecipeEdit>[0] }) {
  const [sheet, setSheet] = useState<"edit" | "ai" | null>(null);
  const { canAskAi } = useRecipeEdit(recipe);
  return (
    <>
      {canAskAi && <button type="button" onClick={() => setSheet("ai")} className="touch rounded-full border border-line2 bg-transparent px-4 text-sm font-medium text-ink">Ask AI</button>}
      <button type="button" onClick={() => setSheet("edit")} className="touch rounded-full border border-line2 bg-transparent px-4 text-sm font-medium text-ink">Edit</button>
      {sheet === "ai" && <AskAiSheet recipe={recipe} onClose={() => setSheet(null)} />}
      {sheet === "edit" && <EditRecipeSheet recipe={recipe} onClose={() => setSheet(null)} />}
    </>
  );
}

export function RecipeDetailScreen({ id }: { id: string }) {
  const r = useRecipe(id);
  return (
    <AppShell current="recipes" stickyAction>
      <div className="relative flex min-h-0 flex-1 flex-col lg:max-w-2xl">
        <header className="flex shrink-0 items-center gap-1 px-2 pb-1.5 pt-3">
          <Link href="/recipes" aria-label="Back" className="flex h-11 w-11 items-center justify-center text-ink">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </Link>
          <div className="flex-1" />
          {!r.isLoading && !r.notFound && <EditBar recipe={r.recipe} />}
          {!r.isLoading && !r.notFound && (
            <button type="button" onClick={r.toggleSave} aria-pressed={r.saved} aria-label="Save recipe" className="flex h-11 w-11 items-center justify-center bg-transparent text-ink">
              <svg width="22" height="22" viewBox="0 0 24 24" fill={r.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" /></svg>
            </button>
          )}
        </header>

        {r.isLoading && <Skeleton />}
        {!r.isLoading && r.notFound && <p className="px-5 text-sm text-muted">That recipe does not exist.</p>}
        {!r.isLoading && !r.notFound && (
          <>
            <div className="rail flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 pb-28">
              <div role="img" aria-label={`Picture of ${r.recipe.name}`} className="rise flex h-[170px] shrink-0 items-center justify-center rounded-[20px]" style={{ background: r.recipe.tint }}><RecipeArt image={r.recipe.image} size={150} eager /></div>
              <div>
                <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">{r.recipe.name}</h1>
                {r.recipe.blurb && <p className="mt-1.5 text-sm leading-normal text-ink2">{r.recipe.blurb}</p>}
              </div>
              {r.recipe.written && !r.saved && <p className="m-0 -mb-2 rounded-2xl bg-butter-soft px-4 py-3 text-sm text-onp">Not kept yet. Tap the bookmark to keep it.</p>}
              <p className="m-0 -mb-2 text-sm text-ink2">{r.cookLine}</p>
              <div className="grid shrink-0 grid-cols-3 overflow-hidden rounded-[20px] border border-line">
                {r.stats.map((s, i) => (
                  <div key={s.label} className={`px-3.5 py-3 ${i % 3 > 0 ? "border-l border-line" : ""} ${i >= 3 ? "border-t border-line" : ""}`}>
                    <div className="text-xs text-muted">{s.label}</div>
                    <div className="mt-0.5 text-lg tabular-nums">{s.value}</div>
                  </div>
                ))}
              </div>

              <section>
                <div className="mb-1.5 flex items-center justify-between">
                  <h2 className="m-0 text-base font-medium">Ingredients</h2>
                  <div className="flex items-center">
                    <button type="button" onClick={r.fewer} aria-label="Fewer servings" className="h-11 w-11 bg-transparent p-0 text-xl text-ink">&minus;</button>
                    <span className="min-w-[76px] text-center text-sm tabular-nums">{r.servings} servings</span>
                    <button type="button" onClick={r.more} aria-label="More servings" className="h-11 w-11 bg-transparent p-0 text-xl text-ink">+</button>
                  </div>
                </div>
                {r.ingredients.map((i) => (
                  <div key={i.name} className="flex items-center gap-3 border-t border-line py-[11px]">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${i.inPantry ? "bg-mint" : "bg-peach"}`} />
                    <span className="min-w-0 flex-1 text-[15px]">
                      {i.name}
                      {i.note && <span className="block text-sm text-ink2">{i.note}</span>}
                    </span>
                    <span className="text-right text-sm tabular-nums text-ink2">
                      {i.amount}
                      {i.weight && <span className="block text-xs text-muted">≈ {i.weight}</span>}
                    </span>
                    {!i.inPantry && i.tag !== "Optional" && i.tag !== "Swap" && <button type="button" onClick={i.iHave} aria-label={`I have ${i.name}`} className="touch rounded-full border border-line2 bg-bg px-3 text-sm font-medium text-ink">I have it</button>}
                    <span className={`rounded-full px-2.5 py-[3px] text-xs font-medium text-onp ${i.inPantry || i.tag === "Swap" || i.tag === "Optional" ? "bg-mint" : i.tag === "Check" ? "bg-butter" : r.listed ? "bg-sky" : "bg-peach"}`}>{i.tag}</span>
                  </div>
                ))}
                {r.missing > 0 && (
                  <button type="button" onClick={r.toggleList} aria-pressed={r.listed} className={`touch mt-2 w-full rounded-full border text-sm font-medium ${r.listed ? "border-transparent bg-sky text-onp" : "border-line2 bg-transparent text-ink"}`}>
                    {r.listed ? `${r.missing} missing ${r.missing === 1 ? "item is" : "items are"} on your list` : `Add ${r.missing} missing ${r.missing === 1 ? "item" : "items"} to my list`}
                  </button>
                )}
              </section>

              <section>
                <h2 className="m-0 mb-1.5 text-base font-medium">Steps</h2>
                {r.recipe.steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 border-t border-line py-[11px]">
                    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-panel text-xs tabular-nums">{i + 1}</span>
                    <span className="flex-1 text-sm leading-[1.35]">{s.text}</span>
                    <span className="rounded-full px-2.5 py-[3px] text-xs font-medium text-onp" style={{ background: verbColor(s.verb) }}>{s.verb}</span>
                  </div>
                ))}
              </section>
            </div>
            <div className="absolute inset-x-0 bottom-0 border-t border-line bg-bg px-5 pb-5 pt-3">
              <Link href={`/cook/${r.recipe.id}?servings=${r.servings}`} className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink text-[15px] font-medium text-bg">Start cooking</Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
