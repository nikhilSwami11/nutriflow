import type { CookModel } from "@/view-models/cook/useCook";
import { verbColor } from "../shared/verbColor";

const when = (steps: number[]) => (steps.length === 0 ? "Before step 1" : steps.length === 1 ? `Step ${steps[0]}` : `Steps ${steps.slice(0, -1).join(", ")} and ${steps[steps.length - 1]}`);

/** Before the first step: set things out, and see what to use if something is missing. */
export function Prep({ c }: { c: CookModel }) {
  const p = c.prep;
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2">
        <h2 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Get ready</h2>
        <p className="m-0 mt-1 text-[15px] leading-normal text-ink2">Set these out before you start. About {p.minutes} minutes for {p.servings} servings.</p>

        <section aria-label="The process" className="mt-4 flex flex-col gap-3">
          <h3 className="m-0 text-base font-medium">The whole cook, by action</h3>
          {p.process.map((t) => (
            <div key={t.verb} className="flex flex-col gap-2 rounded-[20px] bg-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-medium text-onp" style={{ background: t.verb === "Wash" ? "var(--sky)" : verbColor(t.verb) }}>{t.verb}</span>
                <span className="text-xs text-muted">{when(t.steps)}</span>
              </div>
              {t.items.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {t.items.map((i) => (
                    <li key={i.name} className="flex items-baseline justify-between gap-3 text-[15px]">
                      <span>{i.name}</span>
                      <span className="text-right text-sm tabular-nums text-ink2">{i.amount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[15px]">{t.lines.join(" ")}</p>
              )}
              {t.note && <p className="m-0 text-sm text-ink2">{t.note}</p>}
            </div>
          ))}
        </section>

        <h3 className="m-0 mt-6 text-base font-medium">Set out</h3>
        <ul aria-label="Set out" className="m-0 mt-2 list-none p-0">
          {p.items.map((i) => (
            <li key={i.id} className="border-t border-line">
              <label className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
                <input type="checkbox" checked={i.checked} onChange={i.toggle} className="peer sr-only" />
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-line2 text-bg transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                <span className={`text-[15px] leading-snug transition-colors ${i.checked ? "text-muted line-through" : ""}`}>{i.text}</span>
              </label>
            </li>
          ))}
        </ul>
        <p role="status" className="m-0 mt-2 text-sm text-muted tabular-nums">{p.done} of {p.total} set out</p>

        {p.missing.length > 0 && (
          <section aria-label="Not in your pantry" className="mt-5 rounded-[20px] bg-panel p-4">
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
      <div className="shrink-0 border-t border-line px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <button type="button" onClick={p.start} className="min-h-[52px] w-full rounded-full bg-ink px-6 text-[15px] font-medium text-bg">Start cooking</button>
      </div>
    </>
  );
}
