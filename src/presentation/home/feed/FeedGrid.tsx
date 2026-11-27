import Link from "next/link";
import { FEED_KINDS, type FeedItem } from "@/view-models/feed/types";
import type { HomeModel } from "@/view-models/home/useHome";
import { MacroChart } from "../MacroChart";
import { NextMealHero } from "../NextMealHero";
import { PantryNudge } from "../Nudges";
import { ShopNowCard } from "../ShopNow";
import { TodayLine } from "../TodayLine";
import { Tracked } from "./Tracked";

/** The meal and the chart stack in the wide column (chart right under the meal); the rest sit beside them. The feed's order decides who comes first. */
const SPAN: Record<string, string> = { "next-meal": "col-span-7", "shop-now": "col-span-7", "day-chart": "col-span-7", default: "col-span-5" };

/**
 * Desktop Home: the same feed as mobile, drawn as dashboard cards instead of posts.
 * Same items, same order, same events, so what you do here teaches the feed too.
 */
export function FeedGrid({ h }: { h: HomeModel }) {
  const { items, track } = h.feed;

  const render = (item: FeedItem, position: number) => {
    const open = () => track(item, "open", position);
    switch (item.kind) {
      case "next-meal":
        return <NextMealHero next={h.next} shopElsewhere={!!h.shopNow && h.shopNow.id === h.next?.id} onOpen={open} onEaten={() => track(item, "mark-eaten", position)} />;
      case "shop-now":
        return h.shopNow ? <ShopNowCard s={h.shopNow} onOpen={open} onAdd={() => track(item, "add-to-list", position)} /> : null;
      case "all-done":
        return (
          <article aria-label="Up next" className="rounded-[20px] bg-mint p-5 text-onp">
            <h2 className="m-0 text-xl font-medium">All meals eaten for today</h2>
            <p className="mt-1 text-sm">Nice work. Tomorrow&apos;s plan is on the Plan page.</p>
          </article>
        );
      case "day-chart":
        return <MacroChart c={h.chart} above={<TodayLine t={h.today} />} />;
      case "pantry-alert":
        return h.pantry ? <PantryNudge p={{ ...h.pantry, toggle: () => { track(item, "add-to-list", position); h.pantry?.toggle(); } }} /> : null;
      case "plan-nudge":
        return (
          <section aria-label="Plan" className="flex flex-col gap-2 rounded-[20px] border border-line bg-bg p-4">
            <h2 className="m-0 text-sm font-medium">Plan</h2>
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-ink2">{item.notes.map((n) => <li key={n}>{n}</li>)}</ul>
            <Link href="/plan" onClick={open} className="hoverable touch mt-1 flex items-center self-start rounded-full border border-line2 px-4 text-sm font-medium">Open plan →</Link>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {items.map((item, position) =>
        FEED_KINDS.includes(item.kind) ? (
          <div key={item.id} className={`rise ${SPAN[item.kind] ?? SPAN.default}`} style={{ "--i": Math.min(position + 1, 6) } as React.CSSProperties}>
            <Tracked item={item} position={position} track={track}>{render(item, position)}</Tracked>
          </div>
        ) : null,
      )}
    </>
  );
}
