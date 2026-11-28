"use client";
import { useEffect, useRef } from "react";
import { useModalFocus } from "../shared/useModalFocus";
import { ALWAYS, DIET_LABEL, DIETS, GOALS, useOnboarding } from "@/view-models/profile/useOnboarding";

const NOTE = { anything: "No limits", vegetarian: "No meat or fish", eggetarian: "Vegetarian plus eggs", vegan: "No animal products" } as const;
const pick = (on: boolean) => `touch rounded-2xl border px-4 py-3 text-left ${on ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg text-ink"}`;

/** Three questions for a brand-new person, so the app has something to decide with. Skippable, asked once. */
export function OnboardingSheet() {
  const o = useOnboarding();
  const { skip } = o;
  const dialog = useRef<HTMLDivElement>(null);
  useModalFocus(dialog, o.show);
  useEffect(() => {
    if (!o.show) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [o.show, skip]);
  if (!o.show) return null;

  const last = o.step === o.steps - 1;
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button type="button" tabIndex={-1} aria-label="Skip for now" onClick={o.skip} className="absolute inset-0 bg-black/30" />
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="A few questions" className="story-in relative mx-auto flex max-h-[90dvh] w-full max-w-[460px] flex-col gap-4 rounded-t-[28px] bg-bg px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-center justify-between">
          <div role="progressbar" aria-label="Question" aria-valuemin={1} aria-valuemax={o.steps} aria-valuenow={o.step + 1} className="flex gap-1.5">
            {Array.from({ length: o.steps }, (_, i) => <span key={i} className={`h-1.5 w-8 rounded-full ${i <= o.step ? "bg-ink" : "bg-track"}`} />)}
          </div>
          <button type="button" onClick={o.skip} className="touch bg-transparent px-2 text-sm text-ink2">Skip for now</button>
        </div>

        {o.step === 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">How do you eat?</h2>
            <div role="group" aria-label="Diet" className="grid grid-cols-2 gap-2">
              {DIETS.map((d) => (
                <button key={d} type="button" aria-label={DIET_LABEL[d]} aria-pressed={o.diet === d} onClick={() => o.setDiet(d)} className={pick(o.diet === d)}>
                  <span className="block text-[15px] font-medium">{DIET_LABEL[d]}</span>
                  <span className="block text-sm">{NOTE[d]}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        {o.step === 1 && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">What are you aiming for?</h2>
            <div role="group" aria-label="Goal" className="flex flex-col gap-2">
              {GOALS.map((g) => (
                <button key={g.id} type="button" aria-pressed={o.goal === g.id} onClick={() => o.setGoal(g.id)} className={pick(o.goal === g.id)}>
                  <span className="block text-[15px] font-medium">{g.label}</span>
                  <span className="block text-sm">{g.note}</span>
                </button>
              ))}
            </div>
            <p className="m-0 text-sm text-muted">You can change the range any time in Profile.</p>
          </section>
        )}
        {o.step === 2 && (
          <section className="flex flex-col gap-3">
            <h2 className="m-0 text-[22px] font-medium tracking-[-0.01em]">What is always at home?</h2>
            <p className="m-0 text-sm text-ink2">Tap what you usually have. I will not guess the rest.</p>
            <div role="group" aria-label="Always at home" className="flex flex-wrap gap-2">
              {ALWAYS.map((n) => (
                <button key={n} type="button" aria-pressed={o.have.includes(n)} onClick={() => o.toggle(n)} className={`touch rounded-full border px-4 text-sm ${o.have.includes(n) ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg text-ink"}`}>{n}</button>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-2">
          {o.step > 0 && <button type="button" onClick={o.back} className="touch rounded-full border border-line2 bg-bg px-5 text-[15px] font-medium">Back</button>}
          <button type="button" disabled={o.busy} onClick={last ? () => void o.save() : o.next} className="touch flex-1 rounded-full bg-ink px-6 text-[15px] font-medium text-bg disabled:opacity-60">{last ? "Done" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
