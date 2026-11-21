import type { HomeModel } from "@/view-models/home/useHome";
import { AnimatedNumber } from "../shared/AnimatedNumber";

/** Today at a glance, inside the chart card: calories against the plan, then the three macros. */
export function TodayLine({ t }: { t: HomeModel["today"] }) {
  return (
    <div aria-label="Today" role="group" className="flex flex-col gap-2.5 rounded-2xl bg-panel px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted">
          Today <span className="ml-1 text-xl font-medium tracking-[-0.01em] text-ink tabular-nums"><AnimatedNumber value={t.eatenValue} /></span> of {t.goal} kcal
        </div>
        <span className="rounded-full bg-peach px-2.5 py-1 text-xs font-medium text-onp tabular-nums">{t.left}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {t.macros.map((m) => (
          <div key={m.label} className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted">{m.label}</span>
            <span className="text-[13px] tabular-nums text-ink2">{m.value} / {m.goal} g</span>
            <span className="block h-1 overflow-hidden rounded-sm bg-bg">
              <span className="grow-x block h-full rounded-sm transition-[width] duration-700 ease-out" style={{ width: `${m.pct}%`, background: m.color }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
