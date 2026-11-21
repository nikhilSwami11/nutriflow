import type { HomeModel } from "@/view-models/home/useHome";

const SWATCH = [["Protein", "#F2A3A9"], ["Carbs", "#9EC8F3"], ["Fats", "#B9A7EE"]] as const;

export function MacroChart({ c }: { c: HomeModel["chart"] }) {
  const a = c.active;
  return (
    <article aria-label="Calories and macros" className="mx-4 mt-4 flex min-w-0 shrink-0 flex-col gap-4 rounded-[20px] border border-line bg-bg px-3 py-4 lg:m-0 lg:px-6 lg:py-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="m-0 text-base font-medium">{c.title}</h2>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink2">
            {SWATCH.map(([name, color]) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="block h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
                {name}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <svg width="22" height="6" aria-hidden="true"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 4" /></svg>
              Planned
            </span>
          </div>
        </div>
        <div role="group" aria-label="Range" className="flex gap-0.5 rounded-full bg-track p-[3px]">
          {(["7d", "30d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={c.range === r}
              onClick={() => c.setRange(r)}
              className={`min-h-9 rounded-full px-3.5 py-2 text-[13px] ${c.range === r ? "bg-bg font-medium text-ink shadow-[0_1px_5px_rgba(0,0,0,0.10)]" : "bg-transparent font-normal text-ink2"}`}
            >
              {r === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-label={c.aria} className="relative h-[250px]">
        <div className="absolute bottom-[30px] left-0 top-2 w-11">
          {c.yTicks.map((t) => (
            <span key={t.label} className="absolute right-1 -translate-y-1/2 text-[11px] tabular-nums text-muted" style={{ top: `${t.top}%` }}>{t.label}</span>
          ))}
        </div>
        <div className="absolute bottom-[30px] left-[52px] right-2 top-2" onMouseLeave={() => c.setHover(null)}>
          {c.yTicks.map((t) => (
            <div key={t.label} className="absolute left-0 right-0 border-t border-line" style={{ top: `${t.top}%` }} />
          ))}
          <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-hidden="true" className="absolute left-0 top-0 h-full w-full overflow-visible">
            <path d={c.geo.areaP} fill="#F2A3A9" fillOpacity="0.85" />
            <path d={c.geo.areaC} fill="#9EC8F3" fillOpacity="0.85" />
            <path d={c.geo.areaF} fill="#B9A7EE" fillOpacity="0.85" />
            <path d={c.geo.planned} fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d={c.geo.line} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="absolute top-0 h-full border-l border-dashed border-line2" style={{ left: `${a.x}%` }} aria-hidden="true" />
          <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-ink" style={{ left: `${a.x}%`, top: `${a.y}%` }} aria-hidden="true" />
          <div
            className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-line bg-bg p-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            style={{ left: `${a.x}%`, transform: `translateX(${a.flip ? "calc(-100% - 10px)" : "10px"})` }}
          >
            <div className="text-[11px] text-muted">{a.date}</div>
            <div className="mt-1 text-sm font-medium tabular-nums">Eaten {a.eaten}</div>
            <div className="mt-0.5 text-xs tabular-nums text-ink2">Planned {a.planned}</div>
            <div className="mt-2 flex flex-col gap-[3px] border-t border-line pt-2 text-xs tabular-nums">
              {[["Protein", a.protein, "#F2A3A9"], ["Carbs", a.carbs, "#9EC8F3"], ["Fats", a.fat, "#B9A7EE"]].map(([n, v, col]) => (
                <span key={n} className="flex items-center gap-1.5">
                  <span className="block h-2 w-2 rounded-sm" style={{ background: col }} />
                  {n} {v}
                </span>
              ))}
            </div>
            <div className="mt-0.5 text-[11px] text-muted">{a.goal}</div>
          </div>
          {c.hits.map((h) => (
            <button
              key={h.i}
              type="button"
              aria-label={h.label}
              onMouseEnter={() => c.setHover(h.i)}
              onFocus={() => c.setHover(h.i)}
              className="absolute top-0 h-full -translate-x-1/2 bg-transparent p-0"
              style={{ left: `${h.left}%`, width: `${100 / c.hits.length}%` }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 left-[52px] right-2 h-5">
          {c.xLabels.map((x) => (
            <span key={x.i} className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted" style={{ left: `${x.left}%` }}>{x.text}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line px-1 pt-3">
        {c.stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">{s.label}</span>
            <span className="text-base font-medium tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
