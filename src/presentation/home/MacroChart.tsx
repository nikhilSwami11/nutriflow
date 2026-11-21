"use client";
import { memo, useRef } from "react";
import type { ChartGeometry } from "@/view-models/dashboard/chart";
import type { HomeModel } from "@/view-models/home/useHome";

const SWATCH = [["Protein", "#F2A3A9"], ["Carbs", "#9EC8F3"], ["Fats", "#B9A7EE"]] as const;
const GLIDE = "180ms cubic-bezier(0.2, 0.7, 0.2, 1)";

/** Static layers. Memoized so hovering never redraws the paths; `key` replays the reveal when the range changes. */
const Paths = memo(function Paths({ geo }: { geo: ChartGeometry }) {
  return (
    <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-hidden="true" className="reveal absolute left-0 top-0 h-full w-full overflow-visible">
      <path d={geo.areaP} fill="#F2A3A9" fillOpacity="0.85" />
      <path d={geo.areaC} fill="#9EC8F3" fillOpacity="0.85" />
      <path d={geo.areaF} fill="#B9A7EE" fillOpacity="0.85" />
      <path d={geo.planned} fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={geo.line} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
});

export function MacroChart({ c }: { c: HomeModel["chart"] }) {
  const a = c.active;
  const plot = useRef<HTMLDivElement>(null);
  const last = c.count - 1;

  const pick = (clientX: number) => {
    const r = plot.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    c.setHover(Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * last));
  };

  const key = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (step === undefined && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    c.setHover(e.key === "Home" ? 0 : e.key === "End" ? last : Math.min(last, Math.max(0, a.i + (step ?? 0))));
  };

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
        <div role="group" aria-label="Range" className="relative grid grid-cols-2 rounded-full bg-track p-[3px]">
          <span
            aria-hidden="true"
            className="absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-full bg-bg shadow-[0_1px_5px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
            style={{ transform: c.range === "30d" ? "translateX(100%)" : "none" }}
          />
          {(["7d", "30d"] as const).map((r) => (
            <button key={r} type="button" aria-pressed={c.range === r} onClick={() => c.setRange(r)} className={`relative z-10 min-h-9 min-w-[84px] rounded-full px-3.5 py-2 text-[13px] transition-colors ${c.range === r ? "font-medium text-ink" : "font-normal text-ink2"}`}>
              {r === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[250px]">
        <div className="absolute bottom-[30px] left-0 top-2 w-11" aria-hidden="true">
          {c.yTicks.map((t) => (
            <span key={t.label} className="absolute right-1 -translate-y-1/2 text-[11px] tabular-nums text-muted" style={{ top: `${t.top}%` }}>{t.label}</span>
          ))}
        </div>
        <div
          ref={plot}
          role="slider"
          tabIndex={0}
          aria-label="Day"
          aria-valuemin={0}
          aria-valuemax={last}
          aria-valuenow={a.i}
          aria-valuetext={a.summary}
          onPointerMove={(e) => pick(e.clientX)}
          onPointerDown={(e) => pick(e.clientX)}
          onPointerLeave={(e) => e.pointerType === "mouse" && c.setHover(null)}
          onBlur={() => c.setHover(null)}
          onKeyDown={key}
          className="absolute bottom-[30px] left-[52px] right-2 top-2 cursor-crosshair touch-pan-y outline-none"
        >
          {c.yTicks.map((t) => (
            <div key={t.label} className="absolute left-0 right-0 border-t border-line" style={{ top: `${t.top}%` }} aria-hidden="true" />
          ))}
          <Paths key={c.range} geo={c.geo} />
          <div className="absolute top-0 h-full border-l border-dashed border-line2" style={{ left: `${a.x}%`, transition: `left ${GLIDE}` }} aria-hidden="true" />
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-ink shadow-[0_0_0_4px_rgba(20,20,20,0.06)]"
            style={{ left: `${a.x}%`, top: `${a.y}%`, transition: `left ${GLIDE}, top ${GLIDE}` }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-line bg-bg p-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            style={{
              left: `${a.x}%`,
              transform: `translateX(${a.flip ? "calc(-100% - 10px)" : "10px"})`,
              transition: `left ${GLIDE}, transform ${GLIDE}`,
            }}
            aria-hidden="true"
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
        </div>
        <div className="absolute bottom-0 left-[52px] right-2 h-5" aria-hidden="true">
          {c.xLabels.map((x) => (
            <span key={`${c.range}-${x.i}`} className="fade-in absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted" style={{ left: `${x.left}%` }}>{x.text}</span>
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
