import type { CookModel } from "@/view-models/cook/useCook";

/** Everything to have at hand, with a tick for each, and what to use for anything missing. */
export function IngredientsView({ c }: { c: CookModel }) {
  const p = c.prep;
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[15px] leading-normal text-ink2">Set these out before you start. About {p.minutes} minutes for {p.servings} servings.</p>
      <ul aria-label="Ingredients" className="m-0 list-none p-0">
        {p.items.map((i) => (
          <li key={i.id} className="border-t border-line">
            <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
              <input type="checkbox" checked={i.checked} onChange={i.toggle} className="peer sr-only" />
              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-line2 text-bg transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <span className={`text-[15px] leading-snug transition-colors ${i.checked ? "text-muted line-through" : ""}`}>{i.text}</span>
            </label>
          </li>
        ))}
      </ul>
      <p role="status" className="m-0 text-sm text-muted tabular-nums">{p.done} of {p.total} set out</p>
      {p.missing.length > 0 && (
        <section aria-label="Not in your pantry" className="rounded-[20px] bg-panel p-4">
          <h3 className="m-0 text-base font-medium">Not in your pantry</h3>
          <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
            {p.missing.map((m) => (
              <li key={m.name} className="text-[15px] leading-snug">
                <span className="font-medium">{m.name}</span>
                <span className="text-ink2">{m.swap ? `: use ${m.swap}` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
