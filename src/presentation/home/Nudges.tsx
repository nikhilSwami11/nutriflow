import type { HomeModel } from "@/view-models/home/useHome";

export function PantryNudge({ p }: { p: NonNullable<HomeModel["pantry"]> }) {
  return (
    <section aria-label="Pantry alert" className="flex items-center justify-between gap-3 rounded-[20px] border border-line bg-bg p-4">
      <div className="min-w-0">
        <h2 className="m-0 text-sm font-medium">Running low</h2>
        <p className="m-0 mt-0.5 truncate text-sm text-ink2">{p.text}{p.more > 0 && ` and ${p.more} more`}</p>
      </div>
      <button type="button" onClick={p.toggle} aria-pressed={p.listed} className={`touch shrink-0 rounded-full px-4 text-xs font-medium ${p.listed ? "bg-ink text-bg" : "bg-peach text-onp"}`}>
        {p.listed ? "On the list" : "Add to list"}
      </button>
    </section>
  );
}
