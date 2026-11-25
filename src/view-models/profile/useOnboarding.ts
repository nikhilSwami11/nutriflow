"use client";
import { useState } from "react";
import { usePantry } from "../pantry/usePantry";
import { DIET_LABEL, DIETS, useProfile, type Diet } from "./useProfile";

export const SKIP_KEY = "nutriflow.onboarded";
export { DIET_LABEL, DIETS };

export const GOALS = [
  { id: "lose", label: "Lose weight", note: "About 1,500 to 1,800 kcal", min: 1500, max: 1800 },
  { id: "keep", label: "Stay where I am", note: "About 1,800 to 2,100 kcal", min: 1800, max: 2100 },
  { id: "build", label: "Build muscle", note: "About 2,200 to 2,600 kcal", min: 2200, max: 2600 },
] as const;
export type GoalId = (typeof GOALS)[number]["id"];

export const ALWAYS = ["Salt", "Oil", "Pepper", "Spices", "Rice", "Flour", "Eggs", "Milk", "Onions", "Tomatoes", "Potatoes", "Lentils"];

const read = () => { try { return localStorage.getItem(SKIP_KEY) === "1"; } catch { return false; } };
const write = () => { try { localStorage.setItem(SKIP_KEY, "1"); } catch { /* private window: it just asks again next visit */ } };

/** A new person has told us nothing and the pantry is empty: ask three things, once (diet, goal, what is always at home). */
export function useOnboarding() {
  const profile = useProfile();
  const pantry = usePantry();
  const [done, setDone] = useState(read);
  const [step, setStep] = useState(0);
  const [diet, setDiet] = useState<Diet>("anything");
  const [goal, setGoal] = useState<GoalId>("keep");
  const [have, setHave] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const empty = !pantry.isLoading && pantry.view.groups.every((g) => g.items.length === 0);
  const show = !done && !profile.isLoading && !profile.exists && empty;
  const finish = () => { write(); setDone(true); };

  return {
    show,
    step,
    steps: 3,
    diet, setDiet,
    goal, setGoal,
    have,
    toggle: (n: string) => setHave((h) => (h.includes(n) ? h.filter((x) => x !== n) : [...h, n])),
    busy,
    back: () => setStep((s) => Math.max(0, s - 1)),
    next: () => setStep((s) => Math.min(2, s + 1)),
    skip: finish,
    save: async () => {
      setBusy(true);
      const g = GOALS.find((x) => x.id === goal)!;
      try {
        await profile.save({ min: g.min, max: g.max, diet, dislikes: "" });
        if (have.length) await pantry.addHeard(have.map((n) => ({ name: n.toLowerCase(), qty: 3 })));
      } finally {
        setBusy(false);
        finish();
      }
    },
  };
}
