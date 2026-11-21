import type { HomeModel } from "@/view-models/home/useHome";

export function SuggestedCard({ items }: { items: HomeModel["suggestions"] }) {
  return (
    <section aria-label="Suggested for you" className="mt-3.5 min-w-0 shrink-0 lg:m-0 lg:flex lg:flex-col lg:gap-2 lg:rounded-[20px] lg:border lg:border-line lg:bg-bg lg:px-4 lg:pb-3 lg:pt-4">
      <div className="flex items-center gap-2 px-5 pb-2 lg:px-1 lg:pb-0.5">
        <span aria-hidden="true" className="block h-2 w-2 rounded-full bg-[#CFC8F0]" />
        <h2 className="m-0 text-[13px] font-medium text-muted lg:text-sm lg:text-ink">Suggested for you</h2>
      </div>
      <div className="rail flex snap-x snap-mandatory gap-2 overflow-x-auto px-2.5 pb-0.5 lg:flex-col lg:overflow-visible lg:px-0">
        {items.map((g) => (
          <div key={g.id} className="flex min-h-[68px] shrink-0 transition-opacity duration-300 basis-[calc(100%-4px)] snap-center items-center gap-3 rounded-2xl bg-panel py-2.5 pl-3.5 pr-3 lg:basis-auto lg:rounded-[14px]">
            <span className="block min-w-0 flex-1">
              <span className="block text-sm font-medium leading-tight">{g.title}</span>
              <span className="mt-[3px] line-clamp-2 text-xs leading-[1.4] text-ink2">{g.body}</span>
            </span>
            <button
              type="button"
              onClick={g.accept}
              disabled={g.done}
              aria-label={`${g.title}, ${g.cta}`}
              className="touch shrink-0 whitespace-nowrap rounded-full bg-ink px-3.5 text-xs font-medium text-bg hover:opacity-85 disabled:bg-track disabled:text-muted"
            >
              {g.done ? "Done" : g.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
