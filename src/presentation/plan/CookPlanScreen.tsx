"use client";
import Link from "next/link";
import { useCookPlan } from "@/view-models/plan/useCookPlan";
import { AppShell } from "../shell/AppShell";
import { Skeleton } from "../shared/Skeleton";
import { RecipeArt } from "../recipes/RecipeArt";

/** The week as a few cooking days: cook for 2 hours, then reheat and eat. */
export function CookPlanScreen() {
  const c = useCookPlan();
  return (
    <AppShell current="prep">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:px-2">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Cook plan</h1>
        <p className="mt-1 text-sm text-muted">Cook a few days, eat all week.</p>
      </header>
      {c.isLoading && <Skeleton />}
      {!c.isLoading && (
        <div className="rail flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-8 pt-1 lg:max-w-3xl lg:px-2">
          <div role="group" aria-label="Cooking days" className="flex flex-col gap-2">
            <span className="text-sm text-ink2">Days you cook (up to 3)</span>
            <div className="flex gap-2 overflow-x-auto">
              {c.days.map((d) => (
                <button key={d.n} type="button" aria-pressed={d.on} onClick={d.toggle} className={`touch shrink-0 rounded-full border px-4 text-sm ${d.on ? "border-transparent bg-mint font-medium text-onp" : "border-line2 bg-bg text-ink2"}`}>{d.label}</button>
              ))}
            </div>
          </div>

          {c.sessions.length === 0 && <p className="m-0 text-sm text-ink2">Nothing to cook ahead this week. Pick a cook day above.</p>}
          {c.sessions.map((s) => (
            <section key={s.date} aria-label={`${s.title} cooking`} className="rise flex flex-col gap-3 rounded-[20px] border border-line bg-bg p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="m-0 text-lg font-medium">{s.title}</h2>
                <span className="text-sm tabular-nums text-ink2">{s.time} · {s.meals} meals</span>
              </div>
              <ul className="m-0 flex list-none flex-col p-0">
                {s.dishes.map((d) => (
                  <li key={d.id} className="border-t border-line py-2.5 first:border-t-0 first:pt-0">
                    <Link href={`/cook/${d.id}?servings=${d.servings}`} className="flex min-h-14 items-center gap-3 text-ink">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: d.tint }} aria-hidden="true"><RecipeArt image={d.image} size={44} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{d.name}</span>
                        <span className="block text-xs text-muted">Make {d.servings} {d.servings === 1 ? "serving" : "servings"} · {d.eats}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {c.fresh.length > 0 && (
            <section aria-label="Cook as you go" className="flex flex-col gap-1.5 rounded-[20px] bg-panel p-4">
              <h2 className="m-0 text-base font-medium">Quick, cook as you go</h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink2">
                {c.fresh.map((f) => <li key={f.key}>{f.text}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
