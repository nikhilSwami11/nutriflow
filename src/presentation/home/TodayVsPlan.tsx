import type { HomeModel } from "@/view-models/home/useHome";
import { AnimatedNumber } from "../shared/AnimatedNumber";

export function TodayVsPlan({ p }: { p: HomeModel["plan"] }) {
  return (
    <article aria-label="Today vs plan" className="mx-4 mt-4 flex shrink-0 flex-col gap-3 rounded-[20px] border border-line bg-bg px-[18px] py-4 lg:m-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-sm font-medium">Today vs plan</h2>
        <span className="rounded-full bg-peach px-2.5 py-1 text-xs font-medium text-onp tabular-nums">{p.left}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="text-xs text-muted">
          <span className="text-lg font-medium text-ink tabular-nums"><AnimatedNumber value={p.eatenValue} /></span> of {p.goal} kcal
        </div>
        <div className="h-1.5 rounded-[3px] bg-track">
          <div className="grow-x h-full rounded-[3px] transition-[width,background-color] duration-700 ease-out" style={{ width: `${p.fill}%`, background: p.over ? "#F7C9BB" : "#BFE5D2" }} />
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col border-t border-line p-0">
        {p.meals.map((m) => (
          <li key={m.name} className={`flex items-center justify-between gap-2 border-b border-line py-2 text-[13px] last:border-b-0 ${m.pending ? "text-muted" : ""}`}>
            <span className={m.pending ? "" : "text-ink"}>{m.name}</span>
            <span className="flex items-center gap-2 tabular-nums text-ink2">
              {m.over && <span className="rounded-full bg-peach px-2 py-0.5 text-[11px] font-medium text-onp">Over</span>}
              {m.text}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={p.logDinner} aria-pressed={p.dinnerLogged} disabled={p.dinnerLogged} className="hoverable touch rounded-full border border-line2 bg-bg px-3.5 text-xs font-medium text-ink disabled:text-muted">
        {p.dinnerLogged ? "Dinner logged" : "Log dinner"}
      </button>
    </article>
  );
}
