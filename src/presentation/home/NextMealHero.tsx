import Link from "next/link";
import type { HomeModel } from "@/view-models/home/useHome";
import { NextAction } from "./NextAction";
import { RecipeArt } from "../recipes/RecipeArt";

export function NextMealHero({ next, then, onOpen, onEaten }: { next: HomeModel["next"]; then: HomeModel["then"]; onOpen?: () => void; onEaten?: () => void }) {
  if (!next) {
    return (
      <article aria-label="Up next" className="rounded-[20px] bg-mint p-5 text-onp">
        <h2 className="m-0 text-xl font-medium">All meals eaten for today</h2>
        <p className="mt-1 text-sm">Nice work. Tomorrow&apos;s plan is on the Plan page.</p>
      </article>
    );
  }
  return (
    <article aria-label="Up next" className="flex flex-col gap-3 rounded-[20px] border border-line bg-bg p-4 lg:p-5">
      <Link href={`/recipes/${next.id}`} onClick={onOpen} className="group flex items-center gap-4 rounded-2xl">
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-muted">Up next · {next.meal}</span>
          <span className="mt-1 block text-[22px] font-medium leading-tight tracking-[-0.01em] lg:text-2xl">Cook {next.name.toLowerCase()}</span>
          <span className="mt-1.5 block text-sm text-ink2 tabular-nums">{next.readyText} · {next.minutes} min</span>
        </span>
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[20px] transition-transform duration-300 group-hover:scale-[1.04] lg:h-28 lg:w-28" style={{ background: next.tint }} aria-hidden="true">
          <RecipeArt image={next.image} size={84} eager />
        </span>
      </Link>
      <div className="flex items-center justify-between gap-2">
        <NextAction next={next} onOpen={onOpen} />
        <button type="button" onClick={() => { onEaten?.(); next.toggle(); }} className="hoverable touch rounded-full border border-line2 px-4 text-sm font-medium">Mark eaten</button>
      </div>
      <Link href="/eat" className="inline-flex min-h-11 items-center self-start text-sm text-ink2 underline underline-offset-[3px]">Not hungry for this? Pick something else</Link>
      {then.length > 0 && (
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3 text-sm text-muted">
          Then
          {then.map((t) => (
            <Link key={t.id} href={`/recipes/${t.id}`} onClick={onOpen} className="inline-flex min-h-11 items-center rounded-full bg-panel px-3.5 text-ink2 transition-colors hover:bg-track">{t.meal} · {t.name}</Link>
          ))}
        </p>
      )}
    </article>
  );
}
