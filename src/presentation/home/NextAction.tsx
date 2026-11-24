import Link from "next/link";
import { useState } from "react";
import type { HomeModel } from "@/view-models/home/useHome";
import { HaveSheet } from "./HaveSheet";

const BTN = "touch inline-flex items-center justify-center rounded-full px-5 text-[15px] font-medium";

/** The one thing to do about the next meal: shop for what is missing, or cook. */
export function NextAction({ next, onOpen }: { next: NonNullable<HomeModel["next"]>; onOpen?: () => void }) {
  // The list is copied when the sheet opens: answering moves things out of "unknown" and the rows must stay put.
  const [asking, setAsking] = useState<{ items: typeof next.ask; assumed: string[] } | null>(null);
  const sheet = asking && <HaveSheet dish={next.name} items={asking.items} assumed={asking.assumed} onClose={() => setAsking(null)} />;
  if (next.state === "check") {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setAsking({ items: next.ask, assumed: next.assumed })} className={`${BTN} border-0 bg-ink text-bg`}>{next.actionText}</button>
        <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} border border-line2 text-ink`}>Cook anyway</Link>
        {sheet}
      </span>
    );
  }
  if (next.ready) {
    return (
      <>
        <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} bg-ink text-bg`}>
          {next.actionText}
        </Link>
        {sheet}
      </>
    );
  }
  if (next.actionDone) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <Link href="/shopping" onClick={onOpen} className={`${BTN} bg-mint text-onp`}>
          {next.actionText} · View
        </Link>
        <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} border border-line2 text-ink`}>
          Cook anyway
        </Link>
        {sheet}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void next.addMissing()} className={`${BTN} border-0 bg-ink text-bg`}>
        {next.actionText}
      </button>
      <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} border border-line2 text-ink`}>
        Cook anyway
      </Link>
      <button type="button" onClick={() => setAsking({ items: next.ask, assumed: next.assumed })} className="touch bg-transparent px-2 text-sm text-ink2 underline underline-offset-[3px]">I have some of these</button>
      {sheet}
    </span>
  );
}
