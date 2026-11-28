"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCookPlan } from "@/view-models/plan/useCookPlan";
import { useShopping } from "@/view-models/shopping/useShopping";
import { ALLERGENS, APPLIANCES, DIET_LABEL, DIETS, BODY_GOALS, DISLIKES, useOnboarding } from "@/view-models/profile/useOnboarding";
import { RecipeArt } from "../recipes/RecipeArt";
import { useModalFocus } from "../shared/useModalFocus";
import { KitchenScene } from "./KitchenScene";

type Scene = { tint: string; dishes: { id: string; size: number; x: string; y: string }[] };
const dish = (id: string, size: number, x: string, y: string) => ({ id, size, x, y });
const SCENES: Record<string, Scene> = {
  welcome: { tint: "var(--mint-soft)", dishes: [dish("dal-tadka", 140, "4%", "24%"), dish("avocado-toast", 120, "56%", "20%"), dish("buddha-bowl", 110, "46%", "58%")] },
  body: { tint: "var(--sky-soft)", dishes: [dish("oats-banana", 140, "8%", "22%"), dish("poha", 120, "58%", "40%")] },
  goal: { tint: "var(--butter-soft)", dishes: [dish("greek-salad", 130, "6%", "30%"), dish("chicken-stir-fry", 140, "52%", "14%"), dish("banana-bread", 90, "62%", "60%")] },
  diet: { tint: "var(--lavender-soft)", dishes: [dish("chana-masala", 140, "10%", "16%"), dish("paneer-tikka", 130, "54%", "40%")] },
  avoid: { tint: "var(--rose-soft, #f6c9cf)", dishes: [dish("khichdi", 130, "8%", "26%"), dish("idli-sambar", 130, "54%", "22%")] },
  kitchen: { tint: "var(--peach-soft, #f9d7c6)", dishes: [] },
  ready: { tint: "var(--mint-soft)", dishes: [dish("butter-chicken", 140, "6%", "20%"), dish("samosa", 100, "60%", "18%"), dish("egg-fried-rice", 120, "52%", "50%")] },
};

const pick = (on: boolean) => `touch rounded-2xl border px-4 py-3 text-left ${on ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg text-ink"}`;
const chip = (on: boolean) => `touch rounded-full border px-4 text-sm ${on ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg text-ink"}`;
const field = "touch w-full rounded-2xl border border-line2 bg-bg px-4 text-[15px] text-ink";

function Hero({ id }: { id: string }) {
  const s = SCENES[id];
  return (
    <div aria-hidden="true" className="relative h-[34dvh] min-h-[200px] shrink-0 overflow-hidden" style={{ background: s.tint }}>
      {s.dishes.map((d, i) => (
        <span key={d.id} className="bob absolute" style={{ left: d.x, top: d.y, "--i": i } as React.CSSProperties}>
          <RecipeArt image={`/recipes/${d.id}.webp`} size={d.size} eager />
        </span>
      ))}
    </div>
  );
}

/** The last step: your week, planned. Reads the stored plan, so it appears as soon as the profile is saved. */
function Ready({ calories, finish }: { calories: string; finish: () => void }) {
  const cook = useCookPlan();
  const shop = useShopping();
  const meals = cook.sessions.reduce((n, s) => n + s.meals, 0) + cook.fresh.length;
  const [added, setAdded] = useState(false);
  const week = shop.week;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="m-0 text-[26px] font-medium leading-tight tracking-[-0.02em]">Your week is ready</h2>
      {cook.isLoading ? <p role="status" className="m-0 text-sm text-ink2">Building your plan…</p> : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
          <li className="rounded-2xl bg-panel px-4 py-3">{meals} meals planned around {calories} kcal a day</li>
          <li className="rounded-2xl bg-panel px-4 py-3">
            {cook.sessions.length ? `Cook ${cook.sessions.length} ${cook.sessions.length === 1 ? "day" : "days"}: ${cook.sessions.map((s) => `${s.title} (${s.time.toLowerCase()})`).join(", ")}` : "Cooked as you go"}
          </li>
          <li className="rounded-2xl bg-panel px-4 py-3">{week ? `${week.count} things to buy for the week` : "Your list is ready"}</li>
        </ul>
      )}
      <div className="flex flex-col gap-2">
        {week && (
          <button type="button" disabled={added} onClick={() => { week.add(); setAdded(true); }} className="touch rounded-full border border-line2 bg-bg px-5 text-[15px] font-medium text-ink disabled:opacity-60">
            {added ? "On your shopping list" : `Add ${week.count} to my shopping list`}
          </button>
        )}
        <Link href="/prep" onClick={finish} className="touch flex items-center justify-center rounded-full bg-ink px-6 text-[15px] font-medium text-bg">See my cook plan</Link>
        <button type="button" onClick={finish} className="touch rounded-full bg-transparent px-5 text-sm text-ink2">Go to Today</button>
      </div>
    </div>
  );
}

/** Short, illustrated first-run questions: body, goal, diet, what to avoid, your kitchen. Then a week and a cook plan. */
export function Onboarding() {
  const o = useOnboarding();
  const { skip } = o;
  const dialog = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  useModalFocus(dialog, o.show);
  useEffect(() => {
    if (!o.show) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [o.show, skip]);
  if (!o.show) return null;

  const mid = Math.round((o.range.min + o.range.max) / 2);
  const calories = `${o.range.min.toLocaleString()} to ${o.range.max.toLocaleString()}`;
  const last = o.step === "ready";

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-label="Set up NutriFlow" className="fixed inset-0 z-40 mx-auto flex w-full max-w-[460px] flex-col bg-bg lg:inset-y-6 lg:rounded-[28px] lg:border lg:border-line lg:shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
      <div className="relative shrink-0">
        {o.step === "kitchen" ? (
          <div className="flex min-h-[220px] items-center justify-center px-5 pb-1 pt-10" style={{ background: SCENES.kitchen.tint }}>
            <KitchenScene have={o.appliances} onToggle={o.toggleAppliance} />
          </div>
        ) : <Hero id={o.step} />}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-3">
          <div role="progressbar" aria-label="Step" aria-valuemin={1} aria-valuemax={o.steps} aria-valuenow={o.at + 1} className="flex gap-1.5">
            {Array.from({ length: o.steps }, (_, i) => <span key={i} className={`h-1.5 w-6 rounded-full ${i <= o.at ? "bg-onp" : "bg-white/60"}`} />)}
          </div>
          {!last && <button type="button" onClick={o.skip} className="touch bg-transparent px-2 text-sm text-onp">Skip for now</button>}
        </div>
      </div>

      <div className="rail flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-3 pt-5">
        {o.step === "welcome" && (
          <section className="flex flex-col gap-2">
            <h1 className="m-0 text-[28px] font-medium leading-tight tracking-[-0.02em]">Cook two days. Eat all week.</h1>
            <p className="m-0 text-[15px] text-ink2">Five quick questions, then NutriFlow plans your week, your shopping list and your cooking days.</p>
          </section>
        )}
        {o.step === "body" && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">About you</h2>
            <p className="m-0 text-sm text-ink2">Only to suggest a daily calorie range. You can change it any time.</p>
            <label className="flex flex-col gap-1.5 text-sm text-ink2">Height (cm)
              <input className={field} inputMode="decimal" placeholder="170" value={o.height} onChange={(e) => o.setHeight(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-ink2">Weight (kg)
              <input className={field} inputMode="decimal" placeholder="70" value={o.weight} onChange={(e) => o.setWeight(e.target.value)} />
            </label>
          </section>
        )}
        {o.step === "goal" && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">What are you aiming for?</h2>
            <div role="group" aria-label="Goal" className="flex flex-col gap-2">
              {BODY_GOALS.map((g) => (
                <button key={g.id} type="button" aria-pressed={o.goal === g.id} onClick={() => o.setGoal(g.id)} className={pick(o.goal === g.id)}>
                  <span className="block text-[15px] font-medium">{g.label}</span>
                  <span className="block text-sm">{g.note}</span>
                </button>
              ))}
            </div>
            <p className="m-0 text-sm text-muted">{o.bodyOk ? `Your range: about ${calories} kcal a day (around ${mid.toLocaleString()}).` : "Without your height and weight we start at 1,800 to 2,100 kcal."}</p>
          </section>
        )}
        {o.step === "diet" && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">How do you eat?</h2>
            <div role="group" aria-label="Diet" className="grid grid-cols-2 gap-2">
              {DIETS.map((d) => (
                <button key={d} type="button" aria-pressed={o.diet === d} onClick={() => o.setDiet(d)} className={pick(o.diet === d)}>
                  <span className="block text-[15px] font-medium">{DIET_LABEL[d]}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        {o.step === "avoid" && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">Anything to keep out?</h2>
            <p className="m-0 text-sm text-ink2">Allergies are never suggested. Dislikes are skipped.</p>
            <div role="group" aria-label="Allergies" className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => <button key={a} type="button" aria-pressed={o.allergens.includes(a)} onClick={() => o.toggleAllergen(a)} className={chip(o.allergens.includes(a))}>{a}</button>)}
            </div>
            <h3 className="m-0 text-base font-medium">Dislikes</h3>
            <div role="group" aria-label="Dislikes" className="flex flex-wrap gap-2">
              {[...DISLIKES, ...o.dislikes.filter((d) => !DISLIKES.includes(d))].map((d) => <button key={d} type="button" aria-pressed={o.dislikes.includes(d)} onClick={() => o.toggleDislike(d)} className={chip(o.dislikes.includes(d))}>{d}</button>)}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); o.addDislike(typed); setTyped(""); }}>
              <input aria-label="Add a food to skip" className={field} placeholder="Something else" value={typed} onChange={(e) => setTyped(e.target.value)} />
              <button type="submit" className="touch shrink-0 rounded-full border border-line2 bg-bg px-5 text-sm font-medium text-ink">Add</button>
            </form>
          </section>
        )}
        {o.step === "kitchen" && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">What is in your kitchen?</h2>
            <p className="m-0 text-sm text-ink2">Tap what you have. Plans skip dishes that need something you do not.</p>
            <div role="group" aria-label="Appliances" className="flex flex-wrap gap-2">
              {APPLIANCES.map((a) => <button key={a.id} type="button" aria-pressed={o.appliances.includes(a.id)} onClick={() => o.toggleAppliance(a.id)} className={chip(o.appliances.includes(a.id))}>{a.label}</button>)}
            </div>
          </section>
        )}
        {last && <Ready calories={calories} finish={o.finish} />}
      </div>

      {!last && (
        <div className="flex shrink-0 gap-2 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">
          {o.at > 0 && <button type="button" onClick={o.back} className="touch rounded-full border border-line2 bg-bg px-5 text-[15px] font-medium text-ink">Back</button>}
          <button type="button" disabled={o.busy} onClick={() => void o.next()} className="touch flex-1 rounded-full bg-ink px-6 text-[15px] font-medium text-bg disabled:opacity-60">
            {o.step === "welcome" ? "Let's start" : o.step === "kitchen" ? "Build my week" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
