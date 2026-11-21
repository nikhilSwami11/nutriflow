import type { HomeModel } from "@/view-models/home/useHome";

export function TodayVsPlan({ p }: { p: HomeModel["plan"] }) {
  return (
    <article aria-label="Today vs plan" className="mx-4 mt-4 flex shrink-0 flex-col gap-3 rounded-[20px] border border-line bg-bg px-[18px] py-4 lg:m-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-sm font-medium">Today vs plan</h2>
        <span className="rounded-full bg-peach px-2.5 py-1 text-xs font-medium text-onp tabular-nums">{p.left}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-xs text-muted">
          <span className="text-lg font-medium text-ink tabular-nums">{p.eaten}</span> of {p.goal} kcal
        </div>
        <div className="h-1.5 rounded-[3px] bg-track">
          <div className="h-full rounded-[3px] transition-[width] duration-500" style={{ width: `${p.fill}%`, background: p.over ? "#F7C9BB" : "#BFE5D2" }} />
        </div>
      </div>
      <div className="flex flex-col gap-2.5 border-t border-line pt-2.5">
        {p.meals.map((m) => (
          <div key={m.name} className="flex flex-col gap-[5px]">
            <div className="flex justify-between text-xs">
              <span>{m.name}</span>
              <span className="text-ink2 tabular-nums">{m.text}</span>
            </div>
            <div className="relative h-2 rounded bg-track">
              {m.eatenW > 0 && <div className="absolute left-0 top-0 h-2 rounded-l bg-[#BFE5D2]" style={{ width: `${m.eatenW}%` }} />}
              {m.overW > 0 && <div className="absolute top-0 h-2 rounded-r bg-peach" style={{ left: `${m.overL}%`, width: `${m.overW}%` }} />}
              {m.pendingW > 0 && <div className="absolute left-0 top-0 h-2 rounded border border-dashed border-muted" style={{ width: `${m.pendingW}%` }} />}
              <div className="absolute -top-[3px] h-3.5 w-0.5 bg-ink" style={{ left: `${m.tickL}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-[5px]"><span className="block h-2 w-2 rounded-sm bg-[#BFE5D2]" />Eaten</span>
        <span className="flex items-center gap-[5px]"><span className="block h-2 w-2 rounded-sm bg-peach" />Over</span>
        <span className="flex items-center gap-[5px]"><span className="block h-2.5 w-0.5 bg-ink" />Plan</span>
      </div>
      <button type="button" onClick={p.logDinner} aria-pressed={p.dinnerLogged} disabled={p.dinnerLogged} className="touch rounded-full border border-line2 bg-bg px-3.5 text-xs font-medium text-ink disabled:text-muted">
        {p.dinnerLogged ? "Dinner logged" : "Log dinner"}
      </button>
    </article>
  );
}
