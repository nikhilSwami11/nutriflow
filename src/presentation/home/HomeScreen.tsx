"use client";
import { useHome } from "@/view-models/home/useHome";
import { BottomNav } from "../shell/BottomNav";

const TAG = { meal: "bg-peach", pantry: "bg-butter" } as const;
const card = "mx-4 mt-4 shrink-0 rounded-[20px] border border-line bg-bg";

export function HomeScreen() {
  const h = useHome();

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg text-ink">
      <header className="flex items-center justify-between pb-1.5 pl-5 pr-2 pt-3.5">
        <div className="text-[22px] font-semibold tracking-[-0.01em]">NutriFlow</div>
      </header>

      <div className="rail flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
        {!h.isLoading && (
          <>
            <section aria-label="Today" className="mx-4 mt-3.5 shrink-0 rounded-[20px] border border-line px-2 py-3.5">
              <article className="flex min-w-0 flex-col gap-1.5 px-1.5">
                <span className="block text-xs text-muted">Calories</span>
                <span className="block text-[17px] leading-[1.1] tracking-[-0.01em] tabular-nums">{h.today.big}</span>
                <span className="block h-1.5 overflow-hidden rounded-[3px] bg-track">
                  <span className="block h-full rounded-[3px] bg-mint transition-[width] duration-500" style={{ width: `${h.today.pct}%` }} />
                </span>
              </article>
            </section>

            <article aria-label="Trend" className={`${card} flex flex-col gap-3 px-2.5 pb-2.5 pt-3.5`}>
              <div className="px-1.5">
                <h2 className="m-0 text-base font-medium">Calories</h2>
                {h.trend.sub && <p className="mt-1 text-xs text-muted">{h.trend.sub}</p>}
              </div>
              <svg viewBox="0 0 320 140" width="100%" role="img" aria-label={h.trend.label} className="block">
                {[h.trend.model.goalY.min, h.trend.model.goalY.max].map((y) => (
                  <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="var(--line2)" strokeWidth="1" strokeDasharray="3 4" />
                ))}
                {h.trend.model.segments.map((s, i) => (
                  <g key={i}>
                    <path d={s.area} fill="#BFE5D2" />
                    <path d={s.line} fill="none" stroke="#7FC8A4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                ))}
                {h.trend.model.dots.map((d) => (
                  <circle key={d.x} cx={d.x} cy={d.y} r={d.big ? 4.5 : 3.5} fill="var(--ink)" stroke="var(--bg)" strokeWidth="2" />
                ))}
                {h.trend.model.labels.map((b) => (
                  <g key={b.cx}>
                    <text x={b.cx} y="132" textAnchor="middle" fontSize="11" fill="var(--muted)">{b.label}</text>
                    <text x={b.cx} y={b.vy} textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--ink)">{b.val}</text>
                  </g>
                ))}
              </svg>
            </article>

            <article aria-label="Up next" className={`${card} flex flex-col gap-3 p-4`}>
              <h2 className="m-0 text-base font-medium">Up next</h2>
              <div className="grid grid-cols-2 gap-3">
                {h.tasks.map((t) => {
                  const body = (
                    <>
                      <span className="line-clamp-2 w-full text-left text-[15px] font-medium leading-tight">{t.title}</span>
                      <span className={`self-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium text-onp ${TAG[t.kind]}`}>{t.hint}</span>
                    </>
                  );
                  const base = "flex aspect-square w-full flex-col justify-between rounded-[20px] border border-line bg-panel p-3.5";
                  return t.kind === "pantry" ? (
                    <button key={t.id} type="button" onClick={h.toggleBuy} className={`${base} cursor-pointer text-ink transition-transform active:scale-[.97]`}>{body}</button>
                  ) : (
                    <article key={t.id} className={base}>{body}</article>
                  );
                })}
              </div>
            </article>

            {h.pantryAlert && (
              <article aria-label="Pantry alert" className="mt-4 flex shrink-0 flex-col gap-3 border-b border-line px-4 pb-4">
                <h2 className="m-0 text-sm font-medium">Pantry alert</h2>
                <div className="flex flex-col gap-4 rounded-[20px] bg-panel p-[18px]">
                  <div className="text-[15px] font-medium">Running low</div>
                  {h.pantryAlert.rows.map((r) => (
                    <div key={r.id} className="flex flex-col gap-[7px]">
                      <div className="flex justify-between text-[13px]">
                        <span>{r.name}</span>
                        <span className="text-ink2 tabular-nums">{r.qty}</span>
                      </div>
                      <div className="h-2 rounded bg-track">
                        <div className="h-full rounded bg-peach" style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={h.pantryAlert.toggle}
                    aria-pressed={h.pantryAlert.listed}
                    className={`touch self-start rounded-full px-4 text-xs font-medium ${h.pantryAlert.listed ? "bg-ink text-bg" : "bg-peach text-onp"}`}
                  >
                    {h.pantryAlert.listed ? "On the list" : "Add to list"}
                  </button>
                </div>
              </article>
            )}
          </>
        )}
      </div>
      <BottomNav current="home" />
    </div>
  );
}
