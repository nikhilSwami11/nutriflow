"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { suggestedServings, updateHabit, type ServingHabit } from "@/domain/cooking";
import { toDateKey, type MealSlot } from "@/domain/nutrition";
import { changeAmount, dayImpact, estimateMeal, EXTRA_FOODS, logPhotoMeal, scaleForHabit, undoLog, type DetectedItem } from "@/domain/photo";
import { useCookDeps } from "../cook/CookDeps";
import { useHome } from "../home/useHome";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { usePantry } from "../pantry/usePantry";
import { usePantryDeps } from "../pantry/PantryDeps";
import { useCapture } from "../capture/store";
import { useMealDetector } from "./PhotoDeps";

type Phase = "detect" | "estimate" | "logged";
const SLOT_OF: Record<string, MealSlot> = { Breakfast: "breakfast", Lunch: "lunch", Snack: "snack", Dinner: "dinner" };
const num = (n: number) => n.toLocaleString("en-US");

export function usePhotoFlow() {
  const detector = useMealDetector();
  const { logs } = useNutritionDeps();
  const { habits } = useCookDeps();
  const { newId } = usePantryDeps();
  const pantry = usePantry();
  const home = useHome();
  const qc = useQueryClient();
  const { imageUrl, blob } = useCapture();

  const detection = useQuery({ queryKey: ["detect", imageUrl ?? "none"], queryFn: () => detector.detect(blob), staleTime: Infinity, gcTime: 0 });
  const habit = useQuery({
    queryKey: ["habit", detection.data?.recipeId ?? "none"],
    queryFn: () => (detection.data?.recipeId ? habits.get(detection.data.recipeId) : Promise.resolve(null)),
    enabled: !!detection.data,
    staleTime: Infinity,
  });

  const [phase, setPhase] = useState<Phase>("detect");
  const [off, setOff] = useState<string[]>([]);
  const [tweaks, setTweaks] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<DetectedItem[]>([]);
  const [why, setWhy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [logged, setLogged] = useState<{ id: string; slot: MealSlot; before: ServingHabit | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!detection.data || habit.isPending || home.isLoading) return { isLoading: true as const };

  const det = detection.data;
  const usual = suggestedServings(habit.data ?? null);
  const base = [...scaleForHabit(det.items, usual), ...extras];
  const items = base.map((i) => (tweaks[i.id] !== undefined ? { ...i, amount: tweaks[i.id] } : i));
  const kept = items.filter((i) => !off.includes(i.id));
  const est = estimateMeal(kept);
  const slot: MealSlot = home.next ? (SLOT_OF[home.next.meal] ?? "snack") : "snack";
  const impact = dayImpact(home.today.eatenValue, home.today.goalValue, est.kcal);

  const pantryItems = pantry.view.groups.flatMap((g) => g.items);
  const has = (name: string) => pantryItems.some((p) => p.qty > 0 && p.name.toLowerCase().replace(/s$/, "") === name.toLowerCase().replace(/s$/, ""));
  const matched = kept.filter((i) => has(i.pantryName)).map((i) => i.pantryName.toLowerCase());

  const toggle = (id: string) => setOff((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const set = (id: string, dir: 1 | -1) => {
    const cur = items.find((i) => i.id === id);
    if (cur) setTweaks((t) => ({ ...t, [id]: changeAmount(cur, dir).amount }));
  };

  const reasons: { color: string; text: string }[] = [];
  if (det.source !== "vision") reasons.push({ color: "#F4E3A1", text: "Photo recognition is not connected yet, so these items are an example, not read from your photo." });
  if (usual !== 1) reasons.push({ color: "#9EC8F3", text: `Your servings run about ${Math.round(Math.abs(usual - 1) * 100)}% ${usual > 1 ? "above" : "below"} standard, so I scaled the portions ${usual > 1 ? "up" : "down"}.` });
  if (matched.length) reasons.push({ color: "#8FD3C0", text: `Matched with your pantry: ${matched.join(", ")}.` });
  for (const i of kept.filter((k) => k.confidence < 70 && k.reason)) reasons.push({ color: "#F2A3A9", text: `${i.reason}.` });

  const log = async () => {
    setError(null);
    try {
      const id = newId();
      await logPhotoMeal(logs, { id, date: toDateKey(new Date()), slot, name: det.dish, estimate: est });
      // Remember the portions: the main item's amount against what the detector first showed becomes servings eaten.
      const main = det.items[0];
      const eatenAmount = items.find((i) => i.id === main.id)?.amount ?? main.amount;
      const before = habit.data ?? null;
      if (det.recipeId && main.amount > 0 && !off.includes(main.id)) {
        await habits.save(updateHabit(before, det.recipeId, Math.round((eatenAmount / main.amount) * 100) / 100));
      }
      await Promise.all([qc.invalidateQueries({ queryKey: ["meal-logs"] }), qc.invalidateQueries({ queryKey: ["habit", det.recipeId ?? "none"] })]);
      setLogged({ id, slot, before });
      setPhase("logged");
    } catch {
      setError("That could not be saved. Try again.");
    }
  };

  const undo = async () => {
    if (!logged) return;
    try {
      await undoLog(logs, logged.id);
      if (det.recipeId && logged.before) await habits.save(logged.before);
      await Promise.all([qc.invalidateQueries({ queryKey: ["meal-logs"] }), qc.invalidateQueries({ queryKey: ["habit", det.recipeId ?? "none"] })]);
      setLogged(null);
      setPhase("estimate");
    } catch {
      setError("That could not be undone. Try again.");
    }
  };

  return {
    isLoading: false as const,
    phase,
    imageUrl,
    source: det.source,
    dish: det.dish,
    confidence: det.confidence,
    count: `${kept.length} of ${items.length}`,
    tiles: items.map((i) => ({ id: i.id, name: i.name, sub: `${i.confidence}% sure`, on: !off.includes(i.id), color: i.color, toggle: () => toggle(i.id) })),
    boxes: items.filter((i) => !off.includes(i.id)).map((i) => ({ id: i.id, color: i.color, box: i.box, label: i.name, labelWithAmount: `${i.name} ${i.amount} ${i.unit}` })),
    matchedText: matched.length ? `Matched with your pantry: ${matched.join(", ")}.` : "",
    cta: kept.length ? `Estimate with ${kept.length} ${kept.length === 1 ? "item" : "items"}` : "Pick at least one item",
    canEstimate: kept.length > 0,
    toEstimate: () => setPhase("estimate"),
    toDetect: () => setPhase("detect"),
    menu: { open: menu, toggle: () => setMenu((m) => !m), foods: EXTRA_FOODS.filter((f) => !extras.some((e) => e.name === f.name)).map((f) => ({ name: f.name, add: () => { setExtras((e) => [...e, { ...f, id: `extra-${f.name}`, confidence: 100, color: "#CFC8F0", box: { x: 0.35, y: 0.45, w: 0.3, h: 0.2 }, reason: "You added this" }]); setMenu(false); } })) },
    estimate: {
      kcal: num(est.kcal), low: num(est.low), high: num(est.high),
      dayText: impact.left >= 0 ? `Your day would be at ${num(impact.after)} of ${num(impact.goal)} kcal, with ${num(impact.left)} left.` : `Your day would be at ${num(impact.after)} of ${num(impact.goal)} kcal, ${num(-impact.left)} over your goal.`,
      macros: [
        { label: "Protein", val: `${est.protein} g`, pct: Math.min(100, (est.protein / home.today.macros[0].goal) * 100), color: "#F2A3A9" },
        { label: "Carbs", val: `${est.carbs} g`, pct: Math.min(100, (est.carbs / home.today.macros[1].goal) * 100), color: "#9EC8F3" },
        { label: "Fat", val: `${est.fat} g`, pct: Math.min(100, (est.fat / home.today.macros[2].goal) * 100), color: "#B9A7EE" },
      ],
      items: kept.map((i) => ({ id: i.id, name: i.name, color: i.color, amount: `${i.amount} ${i.unit}`, minus: () => set(i.id, -1), plus: () => set(i.id, 1) })),
      why, toggleWhy: () => setWhy((w) => !w), reasons,
    },
    log,
    undo,
    error,
    logged: logged && { kcal: num(est.kcal), slot: logged.slot },
    rememberNote: `I will remember these portions, so your next photo of ${det.dish.toLowerCase()} starts closer to what you really eat.`,
  };
}
export type PhotoModel = Extract<ReturnType<typeof usePhotoFlow>, { isLoading: false }>;
