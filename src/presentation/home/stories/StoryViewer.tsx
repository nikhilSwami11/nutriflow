"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StoryChore } from "@/view-models/feed/storyModel";
import type { HomeModel } from "@/view-models/home/useHome";
import { Bowl } from "../../recipes/Bowl";

const SLIDE_MS = 6000;
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const btn = "touch rounded-full px-5 text-sm font-medium";

/** Time since a chore was started. Reads the clock each second, so a sleeping tab still shows the right time. */
function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sec = Math.max(0, Math.floor((now - since) / 1000));
  return <span className="text-[40px] font-medium tabular-nums tracking-[-0.02em]" role="timer" aria-label="Time spent">{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}</span>;
}

const choreDone = (c: StoryChore) => c.done;

/**
 * Full-screen on a phone, a centred card on desktop. Progress bars advance on their own and pause while you hold
 * or hover. Tap the right side for next, the left for previous. Arrow keys and Escape work. With reduced motion
 * nothing advances by itself.
 */
export function StoryViewer({ s, index, setIndex, onClose }: { s: HomeModel["stories"]; index: number; setIndex: (i: number) => void; onClose: () => void }) {
  const items = s.items;
  const st = items[index];
  const [paused, setPaused] = useState(false);
  const [auto] = useState(() => !reduced());
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const next = () => (index < items.length - 1 ? setIndex(index + 1) : onClose());
  const prev = () => setIndex(Math.max(0, index - 1));

  // Count each slide once: marks it seen and tells the feed.
  useEffect(() => {
    if (st) s.open(st.id, index);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- s.open changes identity every render; the slide id is what matters
  }, [st?.id, index]);

  useEffect(() => {
    closeBtn.current?.focus();
  }, []);

  // Escape and the arrows work wherever focus is, since a focused button can disappear (marking a meal eaten re-renders it).
  const latest = useRef({ next, prev, onClose });
  useEffect(() => {
    latest.current = { next, prev, onClose };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current.onClose();
      else if (e.key === "ArrowRight") latest.current.next();
      else if (e.key === "ArrowLeft") latest.current.prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      const f = dialog.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!f?.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  if (!st) return null;
  // A chore in progress holds the slide: it should not slide away while you are doing it.
  const hold = paused || (st.kind === "chore" && st.chore.startedAt !== null && !choreDone(st.chore));
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose} onKeyDown={key}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`${st.label} story`}
        onClick={stop}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        className="relative flex h-dvh w-full flex-col overflow-hidden text-onp lg:h-[min(760px,90dvh)] lg:w-[390px] lg:rounded-3xl"
        style={{ background: st.tint }}
      >
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3" aria-hidden="true">
          {items.map((it, i) => (
            <span key={it.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-black/15">
              {(i < index || (i === index && !auto)) && <span className="block h-full w-full bg-ink" />}
              {i === index && auto && (
                <span
                  key={it.id}
                  className="story-bar block h-full w-full bg-ink"
                  style={{ "--story-ms": `${SLIDE_MS}ms`, animationPlayState: hold ? "paused" : "running" } as React.CSSProperties}
                  onAnimationEnd={next}
                />
              )}
            </span>
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-7">
          <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-medium">{st.label}</span>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* tap zones: left goes back, right goes on */}
        <button type="button" tabIndex={-1} aria-label="Previous story" onClick={prev} className="absolute bottom-40 left-0 top-24 z-10 w-1/3 bg-transparent" />
        <button type="button" tabIndex={-1} aria-label="Next story" onClick={next} className="absolute bottom-40 right-0 top-24 z-10 w-2/3 bg-transparent" />

        <div key={st.id} className="story-in pointer-events-none relative flex flex-1 flex-col items-center justify-center gap-4 px-8 pt-16 text-center">
          {st.kind === "meal" && (
            <>
              <Bowl size={120} />
              <h2 className="m-0 text-[28px] font-medium leading-tight tracking-[-0.02em]">{st.meal.state === "eaten" ? st.meal.name : `Cook ${st.meal.name.toLowerCase()}`}</h2>
              <p className="m-0 text-sm tabular-nums">{st.meal.minutes} min · {st.meal.kcal} kcal · {st.meal.protein} g protein</p>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.meal.state === "eaten" ? "bg-mint" : st.meal.ready ? "bg-mint" : "bg-peach"}`}>
                {st.meal.state === "eaten" ? "Eaten" : st.meal.readyText}
              </span>
            </>
          )}
          {st.kind === "chore" && (
            <>
              <h2 className="m-0 text-[28px] font-medium leading-tight tracking-[-0.02em]">{st.chore.title}</h2>
              {st.chore.startedAt !== null && !st.chore.done && <Elapsed since={st.chore.startedAt} />}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.chore.done ? "bg-mint" : "bg-white/60"}`}>
                {st.chore.done ? "Done" : st.chore.startedAt !== null ? "In progress" : st.chore.when}
              </span>
            </>
          )}
          {st.kind === "pantry" && (
            <>
              <h2 className="m-0 text-[28px] font-medium tracking-[-0.02em]">Running low</h2>
              <ul className="m-0 flex w-full max-w-xs list-none flex-col gap-2 p-0">
                {st.rows.map((r) => (
                  <li key={r.id} className="flex justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm"><span>{r.name}</span><span className="tabular-nums">{r.qty}</span></li>
                ))}
              </ul>
            </>
          )}
          {st.kind === "plan" && (
            <>
              <h2 className="m-0 text-[28px] font-medium tracking-[-0.02em]">This week</h2>
              <ul className="m-0 flex w-full max-w-xs list-none flex-col gap-2 p-0">
                {st.notes.map((n) => <li key={n} className="rounded-2xl bg-white/60 px-4 py-3 text-sm">{n}</li>)}
              </ul>
            </>
          )}
        </div>

        <div className="relative z-20 flex flex-wrap items-center justify-center gap-2.5 px-6 pb-8">
          {st.kind === "meal" && (
            <>
              <Link href={`/recipes/${st.meal.id}`} onClick={() => s.track(st.id, "open", index)} className={`${btn} flex items-center bg-ink text-bg`}>Open recipe</Link>
              <button type="button" onClick={() => { if (st.meal.state !== "eaten") s.track(st.id, "mark-eaten", index); st.meal.toggle(); }} className={`${btn} border border-black/20 bg-white/70`}>
                {st.meal.state === "eaten" ? "Undo eaten" : "Mark eaten"}
              </button>
            </>
          )}
          {st.kind === "chore" && (st.chore.done ? (
            <button type="button" onClick={st.chore.undo} className={`${btn} border border-black/20 bg-white/70`}>Undo</button>
          ) : (
            <>
              {st.chore.startedAt === null && (
                <button type="button" onClick={() => { s.track(st.id, "open", index); st.chore.start(); }} className={`${btn} bg-ink text-bg`}>Start doing</button>
              )}
              <button type="button" onClick={() => { s.track(st.id, "mark-eaten", index); st.chore.complete(); }} className={`${btn} ${st.chore.startedAt === null ? "border border-black/20 bg-white/70" : "bg-ink text-bg"}`}>Mark complete</button>
            </>
          ))}
          {st.kind === "pantry" && (
            <button type="button" onClick={() => { s.track(st.id, "add-to-list", index); st.toggleList(); }} aria-pressed={st.listed} className={`${btn} ${st.listed ? "bg-ink text-bg" : "border border-black/20 bg-white/70"}`}>
              {st.listed ? "On the list" : "Add to list"}
            </button>
          )}
          {st.kind === "plan" && <Link href="/plan" onClick={() => s.track(st.id, "open", index)} className={`${btn} flex items-center bg-ink text-bg`}>Open plan</Link>}
        </div>
      </div>
    </div>
  );
}
