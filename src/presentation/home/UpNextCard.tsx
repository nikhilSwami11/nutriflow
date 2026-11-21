import type { HomeModel } from "@/view-models/home/useHome";

const TAG = { meal: "bg-peach", pantry: "bg-butter" } as const;

export function UpNextCard({ tasks, toggleBuy }: Pick<HomeModel, "tasks" | "toggleBuy">) {
  return (
    <article aria-label="Up next" className="mx-4 mt-4 flex shrink-0 flex-col gap-3 rounded-[20px] border border-line bg-bg p-4 lg:m-0 lg:px-5 lg:py-[18px]">
      <h2 className="m-0 text-base font-medium">Up next</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
        {tasks.map((t) => {
          const body = (
            <>
              <span className="line-clamp-2 w-full text-left text-[15px] font-medium leading-tight">{t.title}</span>
              <span className={`self-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium text-onp ${TAG[t.kind]}`}>{t.hint}</span>
            </>
          );
          const base = "flex aspect-square w-full flex-col justify-between rounded-[20px] border border-line bg-panel p-3.5";
          return t.kind === "pantry" ? (
            <button key={t.id} type="button" onClick={toggleBuy} className={`${base} cursor-pointer text-ink transition-transform active:scale-[.97]`}>{body}</button>
          ) : (
            <article key={t.id} className={base}>{body}</article>
          );
        })}
      </div>
    </article>
  );
}
