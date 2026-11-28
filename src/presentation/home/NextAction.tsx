import Link from "next/link";
import { useState } from "react";
import type { HomeModel } from "@/view-models/home/useHome";
import { HaveSheet } from "./HaveSheet";

const BTN = "touch inline-flex flex-1 items-center justify-center rounded-full px-5 text-[15px] font-medium";
const ROW = "touch flex w-full items-center bg-transparent px-4 text-left text-[15px] text-ink";

/**
 * The one thing to do about the next meal (shop for what is missing, or cook) as a single button.
 * Everything else about the meal sits behind "More", so the card shows one choice. `children` are extra rows for that menu.
 */
export function NextAction({ next, onOpen, shopElsewhere, children }: { next: NonNullable<HomeModel["next"]>; onOpen?: () => void; /** A "Shop now" post already owns the shopping for this meal, so this button is only about cooking. */ shopElsewhere?: boolean; children?: (close: () => void) => React.ReactNode }) {
  // The sheet lives outside the buttons: answering changes which buttons show, and the sheet must keep its answers.
  const [asking, setAsking] = useState<{ items: typeof next.ask; assumed: string[] } | null>(null);
  const [more, setMore] = useState(false);
  const close = () => setMore(false);
  // The list is copied when the sheet opens: answering moves things out of "unknown" and the rows must stay put.
  const ask = () => (close(), setAsking({ items: next.ask, assumed: next.assumed }));
  const cook = (label: string) => <Link href={`/cook/${next.id}`} onClick={onOpen} className={ROW}>{label}</Link>;

  let primary: React.ReactNode;
  let extras: React.ReactNode = null;
  if (shopElsewhere && next.state === "missing") {
    primary = <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} border border-line2 text-ink`}>Start cooking</Link>;
    extras = <button type="button" onClick={ask} className={ROW}>I have some of these</button>;
  } else if (next.state === "check") {
    // Assume yes: cook now, check the pantry only if the person asks.
    primary = <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} bg-ink text-bg`}>{next.actionText}</Link>;
    extras = <button type="button" onClick={ask} className={ROW}>Check what I have</button>;
  } else if (next.ready) {
    primary = <Link href={`/cook/${next.id}`} onClick={onOpen} className={`${BTN} bg-ink text-bg`}>{next.actionText}</Link>;
  } else if (next.actionDone) {
    primary = <Link href="/shopping" onClick={onOpen} className={`${BTN} bg-mint text-onp`}>{next.actionText} · View</Link>;
    extras = cook("Cook anyway");
  } else {
    primary = <button type="button" onClick={() => void next.addMissing()} className={`${BTN} border-0 bg-ink text-bg`}>{next.actionText}</button>;
    extras = (
      <>
        {cook("Cook anyway")}
        <button type="button" onClick={ask} className={ROW}>I have some of these</button>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {primary}
        {next.swap && (
          <button type="button" aria-label="New recipe" onClick={() => { close(); next.swap?.(); }} className="hoverable touch flex w-11 shrink-0 items-center justify-center rounded-full border border-line2 bg-transparent text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5l2-2.5M20 20v-5h-5" /></svg>
          </button>
        )}
        <button type="button" aria-label="More" aria-expanded={more} onClick={() => setMore(!more)} className="hoverable touch flex w-11 shrink-0 items-center justify-center rounded-full border border-line2 bg-transparent text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
        </button>
      </div>
      {more && (
        <div className="fade-in flex flex-col divide-y divide-line overflow-hidden rounded-2xl bg-panel">
          {extras}
          {children?.(close)}
        </div>
      )}
      {asking && <HaveSheet dish={next.name} items={asking.items} assumed={asking.assumed} onClose={() => setAsking(null)} />}
    </>
  );
}
