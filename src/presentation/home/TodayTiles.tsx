import type { HomeModel } from "@/view-models/home/useHome";
import { AnimatedNumber } from "../shared/AnimatedNumber";

export function TodayTiles({ tiles }: { tiles: HomeModel["tiles"] }) {
  return (
    <section aria-label="Today" className="mx-4 mt-3.5 grid shrink-0 grid-cols-4 gap-1 rounded-[20px] border border-line px-2 py-3.5 lg:m-0 lg:gap-0 lg:overflow-hidden lg:p-0">
      {tiles.map((t) => (
        <article key={t.label} className="flex min-w-0 flex-col gap-1.5 px-1.5 lg:gap-2 lg:border-l lg:border-line lg:px-6 lg:py-[18px] lg:first:border-l-0">
          <span className="block text-xs text-muted">{t.label}</span>
          <span className="block text-[17px] leading-[1.1] tracking-[-0.01em] tabular-nums lg:text-[28px]"><AnimatedNumber value={t.value} />{t.unit && ` ${t.unit}`}</span>
          <span className="block h-1.5 overflow-hidden rounded-[3px] bg-track">
            <span className="grow-x block h-full rounded-[3px] transition-[width] duration-700 ease-out" style={{ width: `${t.pct}%`, background: t.color }} />
          </span>
          <span className="hidden text-xs text-muted lg:block">{t.sub}</span>
        </article>
      ))}
    </section>
  );
}
