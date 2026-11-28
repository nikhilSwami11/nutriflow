"use client";
import Link from "next/link";
import { useState } from "react";
import { useEat, WANTS } from "@/view-models/eat/useEat";
import { HaveSheet } from "../home/HaveSheet";
import { RecipeArt } from "../recipes/RecipeArt";
import { AppShell } from "../shell/AppShell";
import { tint } from "../shared/tint";

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

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
        <div role="group" aria-label="What you feel like" className="-mx-5 flex shrink-0 gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
          {WANTS.map((w) => (
            <button key={w.id} type="button" aria-pressed={e.wants.includes(w.id)} onClick={() => e.toggle(w.id)} disabled={e.isLoading || e.busy} className={`touch shrink-0 rounded-full border px-4 text-sm ${e.wants.includes(w.id) ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg"}`}>
              {w.label}
            </button>
          ))}
        </div>

        {e.isLoading && (
          <div role="status" aria-label="Writing a meal for you" className="flex shrink-0 flex-col overflow-hidden rounded-[20px] border border-line lg:flex-row">
            <div className="skeleton h-56 w-full bg-track lg:h-64 lg:w-72" />
            <p className="m-0 p-4 text-[15px] font-medium">Writing a meal for you</p>
          </div>
        )}

        {!e.isLoading && b && (
          <article aria-label="Best pick" aria-busy={e.busy} className="flex shrink-0 flex-col overflow-hidden rounded-[20px] border border-line bg-bg lg:flex-row">
            <div className="relative shrink-0 lg:w-72">
              <Link href={`/recipes/${b.id}`} aria-label={`Open ${b.name}`} className="flex h-56 w-full items-center justify-center lg:h-full lg:min-h-64" style={{ background: b.tint }}>
                <RecipeArt image={b.image} size={190} eager />
              </Link>
              <button type="button" onClick={e.toggleSave} aria-pressed={e.saved} aria-label={e.saved ? `Saved ${b.name}` : `Save ${b.name}`} className="touch absolute right-2 top-2 flex w-11 items-center justify-center rounded-full border-0 bg-bg p-0 text-ink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill={e.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
              </button>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4 lg:p-5">
              <div>
                <h2 className="m-0 text-[22px] font-medium leading-tight tracking-[-0.01em]">{b.name}</h2>
                {b.blurb && <p className="m-0 mt-1 line-clamp-2 text-sm text-ink2">{b.blurb}</p>}
                <p className="m-0 mt-2 text-sm text-ink2 tabular-nums">{b.facts}{b.written ? " · estimate" : ""}</p>
                {!b.ready && <p className="m-0 text-sm text-ink2">{b.status}</p>}
              </div>
              {/* One main action, the same rule as Home: cook when nothing blocks, else shop for what is missing. */}
              <div className="flex flex-wrap items-center gap-2">
                {b.ready ? (
                  <>
                    <Link href={`/cook/${b.id}`} className={`${btn} bg-ink text-bg`}>Start cooking</Link>
                    {b.state === "check" && <button type="button" onClick={() => setAsking({ items: b.ask, assumed: b.assumed })} className={`${btn} border border-line2`}>Check what I have</button>}
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

        {e.busy && <p role="status" className="m-0 -mt-2 text-sm text-ink2">Writing a new one</p>}

        {!e.isLoading && e.ideas.length > 0 && (
          <section aria-label="Other ideas" className="flex flex-col gap-2">
            <h2 className="m-0 text-base font-medium">Or try</h2>
            <ul className="-mx-5 m-0 flex list-none snap-x gap-3 overflow-x-auto p-0 px-5 pb-1 lg:mx-0 lg:px-0">
              {e.ideas.map((i) => {
                const body = (
                  <>
                    <span className={`flex h-[120px] w-full items-center justify-center rounded-2xl ${i.tint ? "" : tint(i.name)}`} style={i.tint ? { background: i.tint } : undefined} aria-hidden="true">
                      <RecipeArt image={i.image} size={96} />
                    </span>
                    <span className="mt-2 line-clamp-2 text-[15px] font-medium leading-snug">{i.name}</span>
                    {i.facts && <span className="text-sm text-ink2 tabular-nums">{i.facts}</span>}
                  </>
                );
                return (
                  <li key={i.name} className="w-[148px] shrink-0 snap-start">
                    {i.recipeId ? (
                      <Link href={`/recipes/${i.recipeId}`} className="flex flex-col text-ink">{body}</Link>
                    ) : (
                      <button type="button" onClick={() => e.writeIdea(i.name)} disabled={e.busy} className="flex w-full flex-col items-stretch border-0 bg-transparent p-0 text-left text-ink">{body}</button>
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
