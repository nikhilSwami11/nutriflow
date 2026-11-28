"use client";
import { useState } from "react";
import { targetFromBody, type BodyGoal } from "@/domain/nutrition";
import { ALL_APPLIANCES } from "@/domain/kitchen";
import { usePantry } from "../pantry/usePantry";
import { APPLIANCES, DIET_LABEL, DIETS, useProfile, type Diet } from "./useProfile";

export const SKIP_KEY = "nutriflow.onboarded";
export { APPLIANCES, DIET_LABEL, DIETS };

/** The Profile screen's calorie presets. */
export const GOALS = [
  { id: "lose", label: "Lose weight", note: "About 1,500 to 1,800 kcal", min: 1500, max: 1800 },
  { id: "keep", label: "Stay where I am", note: "About 1,800 to 2,100 kcal", min: 1800, max: 2100 },
  { id: "build", label: "Build muscle", note: "About 2,200 to 2,600 kcal", min: 2200, max: 2600 },
] as const;

/** Onboarding's goals: the range comes from height and weight instead. */
export const BODY_GOALS = [
  { id: "lose", label: "Lose weight", note: "A little under what you burn" },
  { id: "keep", label: "Stay where I am", note: "About what you burn" },
  { id: "build", label: "Build muscle", note: "A little over, with more protein" },
] as const;
export type GoalId = (typeof BODY_GOALS)[number]["id"];

export const ALLERGENS = ["Peanuts", "Tree nuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish", "Fish", "Sesame"];
export const DISLIKES = ["Mushrooms", "Onion", "Okra", "Brinjal", "Cilantro", "Olives", "Tofu", "Spicy food"];

/** Welcome, body, goal, diet, avoid, kitchen, ready. */
export const STEPS = ["welcome", "body", "goal", "diet", "avoid", "kitchen", "ready"] as const;
export type StepId = (typeof STEPS)[number];

const read = () => { try { return localStorage.getItem(SKIP_KEY) === "1"; } catch { return false; } };
const write = () => { try { localStorage.setItem(SKIP_KEY, "1"); } catch { /* private window: it just asks again next visit */ } };
const num = (s: string) => { const n = Number(s.replace(",", ".")); return Number.isFinite(n) && s.trim() !== "" ? n : null; };
const toggle = (xs: string[], x: string) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

/** A new person (no saved profile, empty pantry) gets a short, illustrated set of questions once, then a ready-made week. */
export function useOnboarding() {
  const profile = useProfile();
  const pantry = usePantry();
  const [done, setDone] = useState(read);
  const [at, setAt] = useState(0);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState<GoalId>("keep");
  const [diet, setDiet] = useState<Diet>("anything");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [appliances, setAppliances] = useState<string[]>(ALL_APPLIANCES);
  const [busy, setBusy] = useState(false);

  const empty = !pantry.isLoading && pantry.view.groups.every((g) => g.items.length === 0);
  // Latched: saving the profile on the kitchen step must not close the flow before the ready screen.
  const [open, setOpen] = useState(false);
  if (!open && !done && !profile.isLoading && !profile.exists && empty) setOpen(true);
  const show = open && !done;
  const finish = () => { write(); setDone(true); };

  const h = num(height), w = num(weight);
  const bodyOk = h !== null && w !== null && h >= 100 && h <= 250 && w >= 25 && w <= 300;
  const range = bodyOk ? targetFromBody({ heightCm: h, weightKg: w, goal: goal as BodyGoal }) : { min: 1800, max: 2100 };
  const step = STEPS[at];

  const save = async () => {
    setBusy(true);
    try {
      await profile.save({
        min: range.min, max: range.max, diet, dislikes: dislikes.join(","), allergens: allergens.map((a) => a.toLowerCase()),
        appliances, heightCm: bodyOk ? h! : undefined, weightKg: bodyOk ? w! : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return {
    show, step, at, steps: STEPS.length,
    height, setHeight, weight, setWeight, bodyOk, range,
    goal, setGoal, diet, setDiet,
    allergens, toggleAllergen: (a: string) => setAllergens((xs) => toggle(xs, a)),
    dislikes, toggleDislike: (d: string) => setDislikes((xs) => toggle(xs, d)),
    addDislike: (d: string) => { const t = d.trim(); if (t && !dislikes.includes(t)) setDislikes((xs) => [...xs, t]); },
    appliances, toggleAppliance: (a: string) => setAppliances((xs) => toggle(xs, a)),
    busy,
    back: () => setAt((s) => Math.max(0, s - 1)),
    /** The kitchen step saves, so the ready step can plan from it. */
    next: async () => {
      if (STEPS[at] === "kitchen") await save();
      setAt((s) => Math.min(STEPS.length - 1, s + 1));
    },
    skip: finish,
    finish,
  };
}
