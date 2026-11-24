"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/view-models/auth/useAuth";
import { DIET_LABEL, DIETS, useProfile, type Diet } from "@/view-models/profile/useProfile";
import { useIntakeWeek } from "@/view-models/profile/useIntakeWeek";
import { AppShell } from "../shell/AppShell";
import { Skeleton } from "../shared/Skeleton";

const DIET_NOTE: Record<Diet, string> = { anything: "No limits", vegetarian: "No meat or fish", eggetarian: "Vegetarian plus eggs", vegan: "No animal products" };
const SCALE = { lo: 1000, hi: 3500 };
const at = (v: number) => `${Math.min(100, Math.max(0, ((v - SCALE.lo) / (SCALE.hi - SCALE.lo)) * 100))}%`;
const kcal = (n: number) => n.toLocaleString("en-US");

/** The goal made visible: your range on a scale, and the last 7 days against it (it moves as you edit). */
function Goal({ min, max, onMin, onMax, touched }: { min: string; max: string; onMin: (v: string) => void; onMax: (v: string) => void; touched: () => void }) {
  const lo = Number(min) || 0;
  const hi = Number(max) || 0;
  const w = useIntakeWeek(lo, hi);
  const ok = hi > lo;
  return (
    <section aria-label="Calories" className="flex flex-col gap-4 rounded-[20px] bg-panel p-4">
      <div>
        <h2 className="m-0 text-base font-medium">Calories a day</h2>
        <p className="m-0 mt-1 text-[28px] font-medium leading-tight tracking-[-0.02em] tabular-nums">{ok ? `${kcal(lo)} to ${kcal(hi)}` : "Set your range"} <span className="text-sm font-normal text-ink2">kcal</span></p>
      </div>

      <div aria-hidden="true" className="relative h-3 rounded-full bg-track">
        {ok && <span className="absolute inset-y-0 rounded-full bg-mint" style={{ left: at(lo), width: `calc(${at(hi)} - ${at(lo)})` }} />}
        <span className="absolute left-0 top-4 text-xs text-muted">{kcal(SCALE.lo)}</span>
        <span className="absolute right-0 top-4 text-xs text-muted">{kcal(SCALE.hi)}</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm text-ink2">From<input aria-label="Calories from" inputMode="numeric" value={min} onChange={(ev) => (onMin(ev.target.value), touched())} className={field} /></label>
        <label className="flex flex-1 flex-col gap-1 text-sm text-ink2">To<input aria-label="Calories to" inputMode="numeric" value={max} onChange={(ev) => (onMax(ev.target.value), touched())} className={field} /></label>
      </div>

      {!w.isLoading && w.days.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <h3 className="m-0 text-sm font-medium">{w.logged ? `In your range ${w.hit} of ${w.logged} logged ${w.logged === 1 ? "day" : "days"}` : "Your week starts when you log a meal"}</h3>
          <div role="img" aria-label={`Last 7 days against ${kcal(lo)} to ${kcal(hi)} kcal`} className="relative flex h-24 items-end gap-2">
            {ok && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 rounded-md bg-mint/30" style={{ bottom: `${w.bandLow}%`, height: `${Math.max(0, w.bandHigh - w.bandLow)}%` }} />}
            {w.days.map((d) => (
              <div key={d.axis + d.today} className="relative flex h-full flex-1 items-end">
                <span className={`block w-full rounded-t-md ${d.state === "in" ? "bg-mint" : d.state === "out" ? "bg-peach" : "border border-dashed border-line2 bg-transparent"}`} style={{ height: d.state === "gap" ? "6%" : `${d.pct}%` }} />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="flex gap-2">
            {w.days.map((d) => <span key={d.axis + d.today} className={`flex-1 text-center text-xs ${d.today ? "font-medium text-ink" : "text-muted"}`}>{d.axis}</span>)}
          </div>
        </div>
      )}
    </section>
  );
}

const field = "touch w-full rounded-2xl border border-line2 bg-bg px-4 text-[15px]";

function Form({ p }: { p: ReturnType<typeof useProfile> }) {
  const [diet, setDiet] = useState<Diet>(p.diet);
  const [min, setMin] = useState(String(p.min));
  const [max, setMax] = useState(String(p.max));
  const [dislikes, setDislikes] = useState(p.dislikes);
  const [done, setDone] = useState(false);
  const touched = () => setDone(false);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (ev) => {
        ev.preventDefault();
        setDone(await p.save({ min: Number(min), max: Number(max), diet, dislikes }));
      }}
    >
      <Goal min={min} max={max} onMin={setMin} onMax={setMax} touched={touched} />

      <section aria-label="Diet" className="flex flex-col gap-2">
        <h2 className="m-0 text-base font-medium">How do you eat?</h2>
        <div role="group" aria-label="Diet" className="grid grid-cols-2 gap-2">
          {DIETS.map((d) => (
            <button key={d} type="button" aria-label={DIET_LABEL[d]} aria-describedby={`diet-${d}`} aria-pressed={diet === d} onClick={() => (setDiet(d), touched())} className={`touch flex flex-col items-start gap-0.5 rounded-2xl border px-4 py-3 text-left ${diet === d ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg text-ink"}`}>
              <span className="text-[15px] font-medium">{DIET_LABEL[d]}</span>
              <span id={`diet-${d}`} className={`text-sm ${diet === d ? "text-onp" : "text-ink2"}`}>{DIET_NOTE[d]}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Dislikes" className="flex flex-col gap-2">
        <label htmlFor="dislikes" className="text-base font-medium">Foods to skip</label>
        <input id="dislikes" value={dislikes} onChange={(ev) => (setDislikes(ev.target.value), touched())} placeholder="mushrooms, peanuts" maxLength={200} className={field} />
        {dislikes.split(",").some((x) => x.trim()) ? (
          <div className="flex flex-wrap gap-2" aria-label="Skipped foods">
            {dislikes.split(",").map((x) => x.trim()).filter(Boolean).map((x) => <span key={x} className="rounded-full bg-rose px-3 py-1.5 text-sm text-onp">{x}</span>)}
          </div>
        ) : null}
        <p className="m-0 text-sm text-muted">Separate with commas. These stay out of what I suggest.</p>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={p.saving} className="touch rounded-full border-0 bg-ink px-6 text-[15px] font-medium text-bg disabled:bg-track disabled:text-muted">Save</button>
        {done && <span role="status" className="text-sm text-ink2">Saved</span>}
        {p.error && !done && <span role="alert" className="text-sm text-ink2">{p.error}</span>}
      </div>
    </form>
  );
}

export function ProfileScreen() {
  const p = useProfile();
  const a = useAuth();
  const router = useRouter();

  return (
    <AppShell current="profile">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:max-w-3xl">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Profile</h1>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6 pt-1 lg:max-w-3xl">
        {p.isLoading && <Skeleton rows={2} />}
        {!p.isLoading && <Form p={p} />}

        <section aria-label="Account" className="flex flex-col gap-2 rounded-[20px] bg-panel p-4">
          {a.status === "in" ? (
            <>
              <h2 className="m-0 text-base font-medium">Signed in</h2>
              <p className="m-0 text-sm text-ink2">{a.email ?? "Google account"}</p>
              <button type="button" disabled={a.busy} onClick={async () => (await a.signOut(), router.replace("/signin"))} className="touch self-start rounded-full border border-line2 bg-transparent px-4 text-sm font-medium">Sign out</button>
            </>
          ) : (
            <>
              <h2 className="m-0 text-base font-medium">You are using a guest account</h2>
              <p className="m-0 text-sm text-ink2">Sign in with Google to keep your pantry, meals and preferences on every device.</p>
              <button type="button" disabled={a.busy} onClick={a.signInWithGoogle} className="touch self-start rounded-full border border-line2 bg-bg px-4 text-sm font-medium">Continue with Google</button>
              {/* A guest cannot get back in, so leaving loses its pantry and meals: ask first. */}
              <button type="button" disabled={a.busy} onClick={async () => { if (window.confirm("Sign out of the guest account? Its pantry and meals will be lost.")) { await a.signOut(); router.replace("/signin"); } }} className="touch self-start rounded-full border border-line2 bg-transparent px-4 text-sm font-medium">Sign out</button>
              {a.error && <p role="alert" className="m-0 text-sm text-ink2">{a.error}</p>}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
