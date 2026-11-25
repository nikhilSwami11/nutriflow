import type { CookModel } from "@/view-models/cook/useCook";
import { verbColor } from "../shared/verbColor";

/** The whole recipe on one scrolling page: each part (marinade, masala...) with its ingredients and its numbered steps. */
export function RecipeView({ c }: { c: CookModel }) {
  return (
    <div className="flex flex-col gap-5">
      {c.full.map((sec) => (
        <section key={sec.title} aria-label={sec.title} className="flex flex-col gap-3">
          {c.full.length > 1 && <h2 className="m-0 text-lg font-medium">{sec.title}</h2>}
          {sec.ingredients.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1.5 rounded-[20px] bg-panel p-4">
              {sec.ingredients.map((i) => (
                <li key={i.name} className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span>{i.name}</span>
                  <span className="text-right text-sm tabular-nums text-ink2">{i.amount}</span>
                </li>
              ))}
            </ul>
          )}
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {sec.steps.map((s) => (
              <li key={s.number} className="flex gap-3">
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-panel text-xs tabular-nums">{s.number}</span>
                <span className="flex-1 text-[15px] leading-snug">
                  {s.text}
                  <span className="ml-2 inline-block rounded-full px-2.5 py-0.5 align-middle text-xs font-medium text-onp" style={{ background: verbColor(s.verb) }}>{s.verb}{s.minutes ? ` · ${s.minutes} min` : ""}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
