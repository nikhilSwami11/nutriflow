import type { HomeModel } from "@/view-models/home/useHome";
import { AnimatedNumber } from "../shared/AnimatedNumber";

/** Today in one line, above the chart. The macros are in the chart's tooltip. */
export function TodayLine({ t }: { t: HomeModel["today"] }) {
  return (
    <div aria-label="Today" role="group" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-panel px-4 py-3">
      <div className="text-xs text-muted">
        Today <span className="ml-1 text-xl font-medium tracking-[-0.01em] text-ink tabular-nums"><AnimatedNumber value={t.eatenValue} /></span> of {t.goal} kcal
      </div>
      <span className="rounded-full bg-peach px-2.5 py-1 text-xs font-medium text-onp tabular-nums">{t.left}</span>
    </div>
  );
}
