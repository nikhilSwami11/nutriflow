import Link from "next/link";
import type { HomeModel } from "@/view-models/home/useHome";

const BTN = "touch inline-flex items-center justify-center rounded-full px-5 text-[15px] font-medium";

/** The one thing to do about the next meal: shop for what is missing, or cook. */
export function NextAction({ next, onOpen }: { next: NonNullable<HomeModel["next"]>; onOpen?: () => void }) {
  if (next.ready) {
    return (
      <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} bg-ink text-bg`}>
        {next.actionText}
      </Link>
    );
  }
  if (next.actionDone) {
    return (
      <Link href="/shopping" onClick={onOpen} className={`${BTN} bg-mint text-onp`}>
        {next.actionText} · View
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => void next.addMissing()} className={`${BTN} border-0 bg-ink text-bg`}>
      {next.actionText}
    </button>
  );
}
