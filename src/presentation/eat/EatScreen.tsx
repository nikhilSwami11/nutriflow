"use client";
import Link from "next/link";
import { useState } from "react";
import { useEat, WANTS } from "@/view-models/eat/useEat";
import { HaveSheet } from "../home/HaveSheet";
import { RecipeArt } from "../recipes/RecipeArt";
import { AppShell } from "../shell/AppShell";

const btn = "touch inline-flex items-center rounded-full px-5 text-[15px] font-medium";

export function EatScreen() {
  const e = useEat();
  const [asking, setAsking] = useState<{ items: { name: string; qty: number; unit: string }[]; assumed: string[] } | null>(null);
  const b = e.best;

  return (
    <AppShell current="eat">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:max-w-3xl">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">What should I eat?</h1>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
        <div role="group" aria-label="What you feel like" className="flex shrink-0 flex-wrap gap-2">
          {WANTS.map((w) => (
            <button key={w.id} type="button" aria-pressed={e.wants.includes(w.id)} onClick={() => e.toggle(w.id)} disabled={e.isLoading} className={`touch rounded-full border px-4 text-sm ${e.wants.includes(w.id) ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg"}`}>
              {w.label}
            </button>
          ))}
        </div>

        {e.isLoading && (
          <div role="status" aria-label="Writing a meal for you" className="flex shrink-0 flex-col gap-3 rounded-[20px] border border-line p-4">
            <div className="aspect-[2/1] w-full rounded-2xl bg-track lg:aspect-auto lg:h-44" />
            <p className="m-0 text-[15px] font-medium">Writing a meal for you</p>
            <p className="m-0 text-sm text-ink2">From your pantry, what is left today and your diet.</p>
          </div>
        )}

        {!e.isLoading && b && (
          <article aria-label="Best pick" className="flex shrink-0 flex-col gap-4 rounded-[20px] border border-line bg-bg p-4 lg:flex-row lg:items-center">
            <Link href={`/recipes/${b.id}`} aria-label={`Open ${b.name}`} className="flex aspect-[2/1] w-full shrink-0 items-center justify-center rounded-2xl lg:aspect-square lg:w-44" style={{ background: b.tint }}>
              <RecipeArt image={b.image} size={150} eager />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-medium text-ink2">{b.written ? "Written for you" : "Best pick"}</div>
                  <button type="button" onClick={e.toggleSave} aria-pressed={e.saved} aria-label={e.saved ? `Saved ${b.name}` : `Save ${b.name}`} className="touch -mr-2 -mt-3 flex w-11 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-ink">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={e.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
                  </button>
                </div>
                <h2 className="m-0 text-xl font-medium tracking-[-0.01em]">{b.name}</h2>
                {b.blurb && <p className="m-0 mt-1 text-sm text-ink2">{b.blurb}</p>}
                <p className="m-0 mt-1 text-sm text-ink2">{b.status}</p>
                <p className="m-0 text-sm text-ink2 tabular-nums">{b.facts}{b.written ? " · estimate" : ""}</p>
              </div>
              {/* One main action, the same rule as Home: cook when nothing blocks, else shop for what is missing. */}
              <div className="flex flex-wrap items-center gap-2">
                {b.ready ? (
                  <Link href={`/cook/${b.id}`} className={`${btn} bg-ink text-bg`}>Start cooking</Link>
                ) : b.state === "check" ? (
                  <>
                    <button type="button" onClick={() => setAsking({ items: b.ask, assumed: b.assumed })} className={`${btn} border-0 bg-ink text-bg`}>Check ingredients</button>
                    <Link href={`/cook/${b.id}`} className={`${btn} border border-line2`}>Cook anyway</Link>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={e.addMissing} disabled={e.listed} className={`${btn} border-0 ${e.listed ? "bg-mint text-onp" : "bg-ink text-bg"}`}>
                      {e.listed ? `${b.missing} on your shopping list` : `Add ${b.missing} to shopping`}
                    </button>
                    <Link href={`/cook/${b.id}`} className={`${btn} border border-line2`}>Cook anyway</Link>
                  </>
                )}
              </div>
            </div>
          </article>
        )}

        {!e.isLoading && e.ideas.length > 0 && (
          <section aria-label="Other ideas" className="flex flex-col gap-1">
            <h2 className="m-0 text-base font-medium">Or</h2>
            <ul className="m-0 list-none border-t border-line p-0">
              {e.ideas.map((i) => {
                const body = (
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[15px]">{i.name}</span>
                    {i.blurb && <span className="text-sm text-ink2">{i.blurb}</span>}
                  </span>
                );
                return (
                  <li key={i.name} className="border-b border-line">
                    {i.recipeId ? (
                      <Link href={`/recipes/${i.recipeId}`} className="touch flex items-center py-2">{body}</Link>
                    ) : (
                      <button type="button" onClick={() => e.writeIdea(i.name)} className="touch flex w-full items-center border-0 bg-transparent py-2 text-left text-ink">{body}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {e.error && <p role="alert" className="m-0 text-sm text-ink2">{e.error} Loosen them in your profile.</p>}

        {e.needsProfile && (
          <p className="m-0 text-sm text-ink2">
            This is a guess. <Link href="/profile" className="underline underline-offset-[3px]">Set your diet and calories</Link> for better picks.
          </p>
        )}
      </div>
          {asking && e.best && <HaveSheet dish={e.best.name} items={asking.items} assumed={asking.assumed} onClose={() => setAsking(null)} />}
    </AppShell>
  );
}
