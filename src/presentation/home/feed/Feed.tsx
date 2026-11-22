import Link from "next/link";
import { FEED_KINDS, type FeedItem } from "@/view-models/feed/types";
import type { HomeModel } from "@/view-models/home/useHome";
import { Bowl } from "../../recipes/Bowl";
import { MacroChart } from "../MacroChart";
import { NextAction } from "../NextAction";
import { TodayLine } from "../TodayLine";
import { Post } from "./Post";
import { Tracked } from "./Tracked";

const BOWL = <path d="M3 12h18a9 9 0 0 1-18 0zM8 8c0-1.6 1-2 1-3.5M12 8c0-1.6 1-2 1-3.5M16 8c0-1.6 1-2 1-3.5" />;
const BARS = <path d="M5 20V10M12 20V4M19 20v-7" />;
const PANTRY = <><rect x="6" y="8" width="12" height="13" rx="3" /><path d="M8 4h8v4H8z" /></>;
const CALENDAR = <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></>;

/**
 * Mobile Home: the server-driven feed. The feed says which posts and in what order; each kind below says how to
 * draw one. A kind this client does not know is skipped, so the server can add posts without breaking old apps.
 */
export function Feed({ h }: { h: HomeModel }) {
  const { items, track } = h.feed;

  const render = (item: FeedItem, position: number) => {
    const toggle = (a: "like" | "unlike" | "save" | "unsave") => track(item, a, position);
    const open = () => track(item, "open", position);

    switch (item.kind) {
      case "next-meal": {
        const n = h.next;
        if (!n) return null;
        return (
          <Post
            label="Up next" color="#BFE5D2" icon={BOWL} title={`Up next · ${n.meal}`} sub={`${n.minutes} min`} onToggle={toggle}
            media={
              <Link href={`/recipes/${n.id}`} onClick={open} aria-label={`Open ${n.name}`} className="flex h-[210px] items-center justify-center" style={{ background: n.tint }}>
                <Bowl size={84} />
              </Link>
            }
            caption={
              <>
                <div>
                  <h3 className="m-0 text-base font-medium">Cook {n.name.toLowerCase()}</h3>
                  <p className="m-0 mt-1 text-sm text-ink2 tabular-nums"><span className={n.ready ? "" : "text-ink"}>{n.readyText}</span></p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <NextAction next={n} onOpen={open} />
                  <button type="button" onClick={() => { track(item, "mark-eaten", position); n.toggle(); }} className="hoverable touch rounded-full border border-line2 px-4 text-sm font-medium">Mark eaten</button>
                </div>
                {h.then.length > 0 && (
                  <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                    Then
                    {h.then.map((t) => (
                      <Link key={t.id} href={`/recipes/${t.id}`} onClick={open} className="inline-flex min-h-11 items-center rounded-full bg-panel px-3.5 text-ink2">{t.meal} · {t.name}</Link>
                    ))}
                  </p>
                )}
              </>
            }
          />
        );
      }
      case "all-done":
        return <Post label="Up next" color="#BFE5D2" icon={BOWL} title="Up next" sub="All done" onToggle={toggle} media={<div className="flex h-[120px] items-center justify-center bg-mint text-sm font-medium text-onp">All meals eaten for today</div>} />;
      case "day-chart":
        return (
          <Post label="Your day" color="#BCD8F0" icon={BARS} title="Your day" sub="Today, 7 days, 30 days" onToggle={toggle}
            media={<div className="px-2 pb-1"><MacroChart bare c={h.chart} above={<TodayLine t={h.today} />} /></div>}
          />
        );
      case "pantry-alert": {
        const p = h.pantry;
        if (!p) return null;
        return (
          <Post label="Pantry alert" color="#F7C9BB" icon={PANTRY} title="Pantry alert" sub={`${p.count} running low`} onToggle={toggle}
            media={
              <div className="mx-5 flex flex-col gap-4 rounded-[20px] bg-panel p-[18px]">
                <div className="text-[15px] font-medium">Running low</div>
                {p.rows.map((r) => (
                  <div key={r.id} className="flex flex-col gap-[7px]">
                    <div className="flex justify-between text-sm"><span>{r.name}</span><span className="tabular-nums text-ink2">{r.qty}</span></div>
                    <div className="h-2 rounded bg-track"><div className="grow-x h-full rounded bg-peach" style={{ width: `${r.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            }
            caption={
              <button type="button" onClick={() => { track(item, "add-to-list", position); p.toggle(); }} aria-pressed={p.listed} className={`touch self-start rounded-full px-4 text-xs font-medium ${p.listed ? "bg-ink text-bg" : "bg-peach text-onp"}`}>
                {p.listed ? "On the list" : "Add to list"}
              </button>
            }
          />
        );
      }
      case "plan-nudge":
        return (
          <Post label="Plan" color="#CFC8F0" icon={CALENDAR} title="Plan" sub={item.reason ?? "This week"} onToggle={toggle}
            media={
              <ul className="mx-5 m-0 flex list-none flex-col gap-2 rounded-[20px] bg-panel p-[18px] text-sm">
                {item.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            }
            caption={<Link href="/plan" onClick={open} className="hoverable touch flex items-center self-start rounded-full border border-line2 px-4 text-sm font-medium">Open plan →</Link>}
          />
        );
      default:
        return null; // a kind from a newer server: skip it
    }
  };

  return (
    <>
      {items.map((item, position) =>
        FEED_KINDS.includes(item.kind) ? (
          <Tracked key={item.id} item={item} position={position} track={track}>{render(item, position)}</Tracked>
        ) : null,
      )}
    </>
  );
}
