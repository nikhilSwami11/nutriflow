import { dishVerb } from "../shared/dishVerb";
import Link from "next/link";
import type { HomeModel } from "@/view-models/home/useHome";
import { NextAction } from "./NextAction";
import { RecipeArt } from "../recipes/RecipeArt";

export function NextMealHero({ next, onOpen, onEaten, shopElsewhere }: { next: HomeModel["next"]; onOpen?: () => void; onEaten?: () => void; shopElsewhere?: boolean }) {
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
          <span className="mt-1 block text-[22px] font-medium leading-tight tracking-[-0.01em] lg:text-2xl">{dishVerb(next.name)} {next.name.toLowerCase()}</span>
          <span className="mt-1.5 block text-sm text-ink2 tabular-nums">{next.readyText} · {next.minutes} min</span>
        </span>
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[20px] transition-transform duration-300 group-hover:scale-[1.04] lg:h-28 lg:w-28" style={{ background: next.tint }} aria-hidden="true">
          <RecipeArt image={next.image} size={84} eager />
        </span>
      </Link>
      <NextAction next={next} onOpen={onOpen} shopElsewhere={shopElsewhere}>
        {(close) => (
          <>
            <button type="button" onClick={() => { close(); onEaten?.(); next.toggle(); }} className="touch flex w-full items-center bg-transparent px-4 text-left text-[15px] text-ink">Mark eaten</button>
            <Link href="/eat" className="touch flex w-full items-center px-4 text-[15px] text-ink">More ideas</Link>
          </>
        )}
      </NextAction>
    </article>
  );
}
