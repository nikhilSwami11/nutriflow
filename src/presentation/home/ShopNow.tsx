import type { HomeModel } from "@/view-models/home/useHome";
import { ShopAction } from "./NextAction";

type Shop = NonNullable<HomeModel["shopNow"]>;

/** What is missing, as plain chips: at most four names, then a count. */
export function MissingChips({ names }: { names: string[] }) {
  const shown = names.slice(0, 4);
  return (
    <ul aria-label="Missing" className="m-0 flex list-none flex-wrap gap-2 p-0">
      {shown.map((n) => <li key={n} className="rounded-full bg-bg px-3.5 py-1.5 text-sm text-ink">{n}</li>)}
      {names.length > shown.length && <li className="rounded-full bg-bg px-3.5 py-1.5 text-sm text-ink2">+{names.length - shown.length} more</li>}
    </ul>
  );
}

/** Desktop card: the same post as on the phone. One button: add what is missing to the list. */
export function ShopNowCard({ s, onAdd, onOpen }: { s: Shop; onAdd: () => void; onOpen?: () => void }) {
  const next = { ...s, addMissing: async () => { onAdd(); await s.addMissing(); } };
  return (
    <article aria-label="Shop now" className="flex flex-col gap-3 rounded-[20px] border border-line bg-bg p-4 lg:p-5">
      <div>
        <span className="block text-xs font-medium text-muted">Shop now · for {s.meal.toLowerCase()}</span>
        <span className="mt-1 block text-xl font-medium leading-tight">{s.names.length === 1 ? `${s.names[0]} for ${s.name.toLowerCase()}` : `${s.names.length} things for ${s.name.toLowerCase()}`}</span>
      </div>
      <div className="rounded-2xl bg-panel p-3.5"><MissingChips names={s.names} /></div>
      <ShopAction next={next} onOpen={onOpen} />
    </article>
  );
}
