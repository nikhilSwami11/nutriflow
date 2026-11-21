"use client";
import Link from "next/link";
import { useCook, type CookModel } from "@/view-models/cook/useCook";
import { AskSheet } from "./AskSheet";
import { CookMotion } from "./CookMotion";
import { GuideCards } from "./GuideCards";
import { Prep } from "./Prep";
import { Bowl } from "../recipes/Bowl";

const VERB: Record<string, string> = { Chop: "#F7C9BB", Simmer: "#9EC8F3", Stir: "#B9A7EE", "Sauté": "#F4E3A1", Serve: "#8FD3C0", Mix: "#CFC8F0" };
const pill = "touch rounded-full px-6 text-[15px] font-medium";

function Shell({ title, children, close }: { title: string; children: React.ReactNode; close?: boolean }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[460px] flex-col overflow-hidden bg-bg text-ink">
      <header className="flex shrink-0 items-center gap-2 px-2 pb-1.5 pt-3">
        {close !== false ? (
          <Link href="/" aria-label="Close cooking" className="flex h-11 w-11 items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </Link>
        ) : <span className="h-11 w-11" />}
        <h1 className="m-0 min-w-0 flex-1 truncate text-center text-base font-medium">{title}</h1>
        <span className="h-11 w-11" />
      </header>
      {children}
    </div>
  );
}

function Steps({ c }: { c: CookModel }) {
  const s = c.step;
  return (
    <Shell title={c.recipe.name}>
      <div role="progressbar" aria-label="Recipe progress" aria-valuemin={1} aria-valuemax={s.count} aria-valuenow={s.number} aria-valuetext={`Step ${s.number} of ${s.count}`} className="flex shrink-0 gap-1 px-5 pb-3">
        {Array.from({ length: s.count }, (_, i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-track"><span className="block h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: i < s.number ? "100%" : "0%" }} /></span>
        ))}
      </div>

      <div key={s.number} className="story-in flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4">
        <CookMotion verb={s.verb} />
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="rounded-full px-3 py-1 text-xs font-medium text-onp" style={{ background: VERB[s.verb] ?? "#CFC8F0" }}>{s.verb}</span>
          <p aria-live="polite" className="m-0 text-[26px] font-medium leading-tight tracking-[-0.02em]">{s.text}</p>
          <p className="m-0 text-xs text-muted tabular-nums">Step {s.number} of {s.count}</p>
        </div>
        <GuideCards look={s.look} tip={s.tip} />
        <button type="button" onClick={() => c.ask.setOpen(true)} className="hoverable touch flex items-center justify-center gap-2 rounded-full border border-line2 px-5 text-[15px] font-medium">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /></svg>
          Ask about this step
        </button>
        {c.timer && (
          <div aria-label="Timer" role="group" className="flex items-center justify-between gap-3 rounded-[20px] border border-line px-5 py-3.5">
            <div>
              <div className="text-xs text-muted">Timer</div>
              <div role="timer" aria-live="off" className="text-[32px] font-light leading-none tabular-nums tracking-[-0.02em]">{c.timer.done ? "0:00" : c.timer.label}</div>
            </div>
            {c.timer.done ? (
              <span className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-onp">Time&apos;s up</span>
            ) : (
              <button type="button" onClick={c.timer.toggle} aria-pressed={c.timer.running} className="touch rounded-full border border-line2 px-5 text-sm font-medium">{c.timer.running ? "Pause" : c.timer.started ? "Resume" : "Start timer"}</button>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-line px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <button type="button" onClick={c.prev} aria-label={s.isFirst ? "Back to the checklist" : "Previous step"} className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-line2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        {c.voice.supported && (
          <button type="button" onClick={c.voice.toggle} aria-pressed={c.voice.on} aria-label="Voice control" className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border ${c.voice.on ? "border-transparent bg-mint text-onp" : "border-line2"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </button>
        )}
        <button type="button" onClick={c.next} className={`${pill} min-h-[52px] flex-1 ${c.timer?.done ? "bg-mint text-onp" : "bg-ink text-bg"}`}>
          {c.timer?.done ? "Time’s up. Mark done" : s.isLast ? "Finish" : "Next step"}
        </button>
      </div>
      {c.ask.open && <AskSheet ask={c.ask} />}
    </Shell>
  );
}

const stepper = "flex h-11 w-11 items-center justify-center rounded-full border border-line2 text-xl disabled:opacity-35";

function Finish({ c }: { c: CookModel }) {
  const f = c.finish;
  return (
    <Shell title={c.recipe.name}>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-5 pb-4 pt-4 text-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-full" style={{ background: c.recipe.tint }} role="img" aria-label={`Bowl of ${c.recipe.name.toLowerCase()} ready to serve`}><Bowl size={80} /></div>
        <h2 className="m-0 text-[28px] font-medium tracking-[-0.02em]">Nicely done</h2>
        <p className="m-0 text-[15px] text-ink2">You made {f.made} {f.made === 1 ? "serving" : "servings"}. How many did you eat?</p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={f.less} disabled={!f.canLess} aria-label="Fewer servings eaten" className={stepper}>&minus;</button>
          <output aria-label="Servings eaten" className="min-w-[110px] text-3xl font-light tabular-nums">{f.eaten}</output>
          <button type="button" onClick={f.more} disabled={!f.canMore} aria-label="More servings eaten" className={stepper}>+</button>
        </div>
        <p className="m-0 text-sm text-ink2"><span className="text-xl font-medium text-ink tabular-nums">{f.kcal}</span> kcal from what you cooked</p>
        {f.error && <p role="alert" className="m-0 text-sm text-ink">{f.error}</p>}
      </div>
      <div className="flex shrink-0 gap-2.5 border-t border-line px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <button type="button" onClick={c.prev} aria-label="Back to the last step" className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-line2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button type="button" onClick={f.submit} disabled={f.submitting} className={`${pill} min-h-[52px] flex-1 bg-ink text-bg disabled:opacity-60`}>{f.submitting ? "Saving" : "Log it"}</button>
      </div>
    </Shell>
  );
}

function Done({ c }: { c: CookModel }) {
  const d = c.done;
  if (!d) return null;
  return (
    <Shell title={c.recipe.name} close={false}>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-5 pb-4 pt-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mint text-onp"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
        <h2 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Logged {d.kcal} kcal</h2>
        <section aria-label="Pantry updated" className="w-full rounded-[20px] bg-panel p-4 text-left">
          <h3 className="m-0 text-sm font-medium">Pantry updated</h3>
          <p className="m-0 mt-1 text-sm text-ink2">
            {d.pantryUpdated > 0 ? `${d.pantryUpdated} ${d.pantryUpdated === 1 ? "item" : "items"} used up.` : "Nothing in your pantry changed."}
            {d.shortfalls > 0 && ` ${d.shortfalls} ${d.shortfalls === 1 ? "ingredient was" : "ingredients were"} not fully in stock.`}
          </p>
        </section>
        {d.habitNote && (
          <section aria-label="Your serving size" className="w-full rounded-[20px] bg-panel p-4 text-left">
            <h3 className="m-0 text-sm font-medium">Your serving size</h3>
            <p className="m-0 mt-1 text-sm text-ink2">{d.habitNote}</p>
          </section>
        )}
        {d.savedHere && <p className="m-0 text-xs text-muted">Saved on this device. It will sync when you are online.</p>}
        {d.warnings.map((w) => <p key={w} role="status" className="m-0 text-xs text-muted">{w}.</p>)}
      </div>
      <div className="shrink-0 border-t border-line px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <Link href="/" className={`${pill} flex min-h-[52px] w-full items-center justify-center bg-ink text-bg`}>Back to home</Link>
      </div>
    </Shell>
  );
}

export function CookScreen({ id, servings }: { id: string; servings?: number }) {
  const c = useCook(id, servings);
  if (c.isLoading) return null;
  if (c.notFound) {
    return <Shell title="Cook"><p className="px-5 text-sm text-muted">That recipe does not exist.</p></Shell>;
  }
  if (c.phase === "prep") return <Shell title={c.recipe.name}><Prep c={c} /></Shell>;
  return c.phase === "cooking" ? <Steps c={c} /> : c.phase === "finish" ? <Finish c={c} /> : <Done c={c} />;
}
