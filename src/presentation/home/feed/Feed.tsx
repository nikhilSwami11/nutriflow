import Link from "next/link";
import type { HomeModel } from "@/view-models/home/useHome";
import { Bowl } from "../../recipes/Bowl";
import { MacroChart } from "../MacroChart";
import { TodayLine } from "../TodayLine";
import { Post } from "./Post";

const BOWL = <path d="M3 12h18a9 9 0 0 1-18 0zM8 8c0-1.6 1-2 1-3.5M12 8c0-1.6 1-2 1-3.5M16 8c0-1.6 1-2 1-3.5" />;
const BARS = <path d="M5 20V10M12 20V4M19 20v-7" />;
const PANTRY = <><rect x="6" y="8" width="12" height="13" rx="3" /><path d="M8 4h8v4H8z" /></>;

/** Mobile Home: a feed of posts, newest thing first. */
export function Feed({ h }: { h: HomeModel }) {
  const n = h.next;
  return (
    <>
      {n ? (
        <Post
          label="Up next"
          color="#BFE5D2"
          icon={BOWL}
          title={`Up next · ${n.meal}`}
          sub={`${n.minutes} min`}
          media={
            <Link href={`/recipes/${n.id}`} aria-label={`Open ${n.name}`} className="flex h-[210px] items-center justify-center" style={{ background: n.tint }}>
              <Bowl size={84} />
            </Link>
          }
          caption={
            <>
              <p className="m-0 text-sm leading-[1.55]"><strong className="font-medium">Cook {n.name.toLowerCase()}.</strong> {n.kcal} kcal, {n.protein} g protein. <span className={n.ready ? "text-ink2" : "text-ink"}>{n.readyText}.</span></p>
              <button type="button" onClick={n.toggle} className="hoverable touch self-start rounded-full border border-line2 px-4 text-[13px] font-medium">Mark eaten</button>
              {h.then.length > 0 && (
                <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                  Then
                  {h.then.map((t) => (
                    <Link key={t.id} href={`/recipes/${t.id}`} className="rounded-full bg-panel px-2.5 py-1 text-ink2">{t.meal} · {t.name}</Link>
                  ))}
                </p>
              )}
            </>
          }
        />
      ) : (
        <Post label="Up next" color="#BFE5D2" icon={BOWL} title="Up next" sub="All done" media={<div className="flex h-[120px] items-center justify-center bg-mint text-sm font-medium text-onp">All meals eaten for today</div>} />
      )}

      <Post
        label="Your day"
        color="#BCD8F0"
        icon={BARS}
        title="Your day"
        sub="Today, 7 days, 30 days"
        media={<div className="px-2 pb-1"><MacroChart bare c={h.chart} above={<TodayLine t={h.today} />} /></div>}
        caption={<Link href="/plan" className="hoverable touch flex items-center self-start rounded-full border border-line2 px-4 text-[13px] font-medium">Plan the week →</Link>}
      />

      {h.pantry && (
        <Post
          label="Pantry alert"
          color="#F7C9BB"
          icon={PANTRY}
          title="Pantry alert"
          sub={`${h.pantry.count} running low`}
          media={
            <div className="mx-4 flex flex-col gap-4 rounded-[20px] bg-panel p-[18px]">
              <div className="text-[15px] font-medium">Running low</div>
              {h.pantry.rows.map((r) => (
                <div key={r.id} className="flex flex-col gap-[7px]">
                  <div className="flex justify-between text-[13px]"><span>{r.name}</span><span className="tabular-nums text-ink2">{r.qty}</span></div>
                  <div className="h-2 rounded bg-track"><div className="grow-x h-full rounded bg-peach" style={{ width: `${r.pct}%` }} /></div>
                </div>
              ))}
            </div>
          }
          caption={
            <button type="button" onClick={h.pantry.toggle} aria-pressed={h.pantry.listed} className={`touch self-start rounded-full px-4 text-xs font-medium ${h.pantry.listed ? "bg-ink text-bg" : "bg-peach text-onp"}`}>
              {h.pantry.listed ? "On the list" : "Add to list"}
            </button>
          }
        />
      )}
    </>
  );
}
