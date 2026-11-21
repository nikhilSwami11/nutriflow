"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  elapsedMs, finishCooking, formatRemaining, habitNote, isDone, isRunning, newTimer, nextStep, nutritionEaten, pauseTimer,
  prevStep, remainingMs, startTimer, stepAt, suggestedServings, type FinishResult, type TimerState, type VoiceCommand,
} from "@/domain/cooking";
import { toDateKey } from "@/domain/nutrition";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { usePantryDeps } from "../pantry/PantryDeps";
import { useRecipeRepo } from "../recipes/RecipeDeps";
import { useCookDeps } from "./CookDeps";
import { speak, useVoiceCommands } from "./useVoiceCommands";
import { useWakeLock } from "./useWakeLock";

type Phase = "cooking" | "finish" | "done";

// A plain function so event handlers and effects read the clock, not the render.
const clock = () => Date.now();

/** One cook session: step by step, a timer on timed steps, then how much you ate, then save. */
export function useCook(id: string, servingsMade?: number) {
  const repo = useRecipeRepo();
  const { pantry, newId } = usePantryDeps();
  const { logs } = useNutritionDeps();
  const { habits, pendingLogs } = useCookDeps();
  const qc = useQueryClient();

  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => repo.list() });
  const habit = useQuery({ queryKey: ["habit", id], queryFn: () => habits.get(id), staleTime: Infinity });
  const recipe = recipes.data?.find((r) => r.id === id);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("cooking");
  const [timers, setTimers] = useState<Record<number, TimerState>>({});
  const [now, setNow] = useState(clock);
  const [eatenRaw, setEatenRaw] = useState<number | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = recipe?.steps.length ?? 0;
  const nav = stepAt(index, count);
  const step = recipe?.steps[nav.index];
  const timer: TimerState | null = step?.minutes ? (timers[nav.index] ?? newTimer(step.minutes)) : null;
  const running = timer ? isRunning(timer) : false;

  // Re-render while a timer runs. The countdown itself reads the clock, so a slow tab stays accurate.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(clock()), 250);
    return () => clearInterval(t);
  }, [running]);

  const finished = timer ? isDone(timer, now) : false;
  const buzzed = useRef<number | null>(null);
  useEffect(() => {
    if (finished && buzzed.current !== nav.index) {
      buzzed.current = nav.index;
      navigator.vibrate?.([200, 100, 200]);
    }
  }, [finished, nav.index]);

  useWakeLock(phase !== "done");

  const toggleTimer = () => {
    if (!timer) return;
    const t = clock();
    setNow(t);
    setTimers((cur) => ({ ...cur, [nav.index]: isRunning(timer) ? pauseTimer(timer, t) : startTimer(timer, t) }));
  };
  const next = () => {
    const n = nextStep(nav);
    if (n) setIndex(n.index);
    else setPhase("finish");
  };
  const prev = () => {
    if (phase === "finish") setPhase("cooking");
    else setIndex(prevStep(nav).index);
  };

  const onVoice = (c: VoiceCommand) => {
    if (phase !== "cooking" || !step) return;
    if (c === "next") next();
    else if (c === "prev") prev();
    else if (c === "repeat") speak(step.text);
    else if (c === "timer-start" && timer && !isRunning(timer)) toggleTimer();
    else if (c === "timer-pause" && timer && isRunning(timer)) toggleTimer();
  };
  const voice = useVoiceCommands(onVoice);

  if (!recipes.data) return { isLoading: true as const };
  if (!recipe || !step) return { isLoading: false as const, notFound: true as const };

  const made = servingsMade && servingsMade > 0 ? servingsMade : recipe.servings;
  const eaten = Math.min(made, eatenRaw ?? suggestedServings(habit.data ?? null));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await finishCooking({ pantry, logs, habits, newId }, { recipe, servingsMade: made, servingsEaten: eaten, date: toDateKey(new Date()) });
      await Promise.all([qc.invalidateQueries({ queryKey: ["meal-logs"] }), qc.invalidateQueries({ queryKey: ["pantry"] }), qc.invalidateQueries({ queryKey: ["habit", id] })]);
      setResult(r);
      setPhase("done");
    } catch {
      setError("That could not be saved. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isLoading: false as const,
    notFound: false as const,
    recipe,
    phase,
    step: { number: nav.index + 1, count: nav.count, text: step.text, verb: step.verb, isFirst: nav.isFirst, isLast: nav.isLast },
    next,
    prev,
    timer: timer
      ? { label: formatRemaining(remainingMs(timer, now)), running, started: elapsedMs(timer, now) > 0, done: finished, toggle: toggleTimer }
      : null,
    voice,
    speakStep: () => speak(step.text),
    finish: {
      made,
      eaten,
      canLess: eaten > 0.5,
      canMore: eaten < made,
      less: () => setEatenRaw(Math.max(0.5, eaten - 0.5)),
      more: () => setEatenRaw(Math.min(made, eaten + 0.5)),
      kcal: nutritionEaten(recipe, made, eaten).kcal,
      submit,
      submitting,
      error,
    },
    done: result && {
      pantryUpdated: result.depleted.length,
      shortfalls: result.shortfalls.length,
      habitNote: result.habit ? habitNote(recipe.name, result.habit) : null,
      warnings: result.warnings,
      savedHere: pendingLogs() > 0,
      kcal: result.log.kcal,
    },
  };
}
export type CookModel = Extract<ReturnType<typeof useCook>, { notFound: false }>;
