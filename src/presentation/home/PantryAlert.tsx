import type { HomeModel } from "@/view-models/home/useHome";

export function PantryAlert({ alert }: { alert: NonNullable<HomeModel["pantryAlert"]> }) {
  return (
    <article aria-label="Pantry alert" className="mt-4 flex shrink-0 flex-col gap-3 border-b border-line px-4 pb-4 lg:m-0 lg:rounded-[20px] lg:border lg:p-5">
      <h2 className="m-0 text-sm font-medium">Pantry alert</h2>
      <div className="flex flex-col gap-4 rounded-[20px] bg-panel p-[18px]">
        <div className="text-[15px] font-medium">Running low</div>
        {alert.rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-[7px]">
            <div className="flex justify-between text-[13px]">
              <span>{r.name}</span>
              <span className="text-ink2 tabular-nums">{r.qty}</span>
            </div>
            <div className="h-2 rounded bg-track">
              <div className="grow-x h-full rounded bg-peach" style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
        <button type="button" onClick={alert.toggle} aria-pressed={alert.listed} className={`touch self-start rounded-full px-4 text-xs font-medium ${alert.listed ? "bg-ink text-bg" : "bg-peach text-onp"}`}>
          {alert.listed ? "On the list" : "Add to list"}
        </button>
      </div>
    </article>
  );
}
