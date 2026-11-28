import Link from "next/link";
import type { HomeModel } from "@/view-models/home/useHome";

const BTN = "touch inline-flex min-w-0 flex-1 items-center justify-center rounded-full px-4 text-[15px] font-medium";

/**
 * Two buttons on the next-meal card: Start cooking, and the one other thing that fits (add what is missing to shopping,
 * else mark it eaten), plus a refresh for a different recipe. Nothing else hides behind a menu.
 */
export function NextAction({ next, onOpen, onEaten, shopElsewhere }: { next: NonNullable<HomeModel["next"]>; onOpen?: () => void; onEaten: () => void; /** A "Shop now" post already owns the shopping for this meal. */ shopElsewhere?: boolean }) {
  const needsShopping = next.state === "missing" && !shopElsewhere;
  let second: React.ReactNode;
  if (needsShopping && next.actionDone) second = <Link href="/shopping" onClick={onOpen} className={`${BTN} bg-mint text-onp`}>{next.actionText} · View</Link>;
  else if (needsShopping) second = <button type="button" onClick={() => void next.addMissing()} className={`${BTN} border border-line2 bg-transparent text-ink`}>{next.actionText}</button>;
  else second = <button type="button" onClick={onEaten} className={`${BTN} border border-line2 bg-transparent text-ink`}>Mark eaten</button>;

  return (
    <div className="flex items-center gap-2">
      <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} bg-ink text-bg`}>Start cooking</Link>
      {second}
      {next.swap && (
        <button type="button" aria-label="New recipe" onClick={() => next.swap?.()} className="hoverable touch flex w-11 shrink-0 items-center justify-center rounded-full border border-line2 bg-transparent text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5l2-2.5M20 20v-5h-5" /></svg>
        </button>
      )}
    </div>
  );
}

/** The Shop now post's one button: add what is missing to the list, then a link to it. */
export function ShopAction({ next, onOpen }: { next: NonNullable<HomeModel["next"]>; onOpen?: () => void }) {
  return next.actionDone
    ? <Link href="/shopping" onClick={onOpen} className={`${BTN} bg-mint text-onp`}>{next.actionText} · View</Link>
    : <button type="button" onClick={() => void next.addMissing()} className={`${BTN} border-0 bg-ink text-bg`}>{next.actionText}</button>;
}
