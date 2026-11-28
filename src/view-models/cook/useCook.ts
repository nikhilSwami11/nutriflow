"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  elapsedMs, finishCooking, formatRemaining, habitNote, isDone, isRunning, newTimer, nutritionEaten, pauseTimer,
  remainingMs, startTimer, suggestedServings, type FinishResult, type TimerState, type VoiceCommand,
} from "@/domain/cooking";
import { answerQuestion, prepList, processTiles, recipeSections, stepGuide, suggestedQuestions, swapsFor } from "@/domain/guide";
import { toDateKey } from "@/domain/nutrition";
import { ingredientStatus } from "@/domain/recipes";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { usePantryDeps } from "../pantry/PantryDeps";
import { usePantry } from "../pantry/usePantry";
import { useRecipeRepo } from "../recipes/RecipeDeps";
import { useMyRecipes } from "../recipes/useMyRecipes";
import { useCookDeps } from "./CookDeps";
import { speak, useVoiceCommands } from "./useVoiceCommands";
import { useWakeLock } from "./useWakeLock";

type Phase = "cooking" | "finish" | "done";

export interface Message {
  id: number;
  who: "you" | "guide";
  text: string;
}

// A plain function so event handlers and effects read the clock, not the render.
const clock = () => Date.now();

/** One cook session: step by step, a timer on timed steps, then how much you ate, then save. */
export function useCook(id: string, servingsMade?: number) {
  const repo = useRecipeRepo();
  const { pantry, newId } = usePantryDeps();
  const { logs } = useNutritionDeps();
  const { habits, leftovers, pendingLogs } = useCookDeps();
  const qc = useQueryClient();
  const pantryView = usePantry();
  const my = useMyRecipes();

  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => repo.list() });
  const habit = useQuery({ queryKey: ["habit", id], queryFn: () => habits.get(id), staleTime: Infinity });
  const recipe = recipes.data?.find((r) => r.id === id);

  const [cardIdx, setCardIdx] = useState(0);
  const [doneTasks, setDoneTasks] = useState<string[]>([]);
  const [view, setView] = useState<"actions" | "ingredients" | "recipe">("actions");
  const [phase, setPhase] = useState<Phase>("cooking");
  const [checked, setChecked] = useState<string[]>([]);
  const [askOpen, setAskOpen] = useState(false);
  const [thread, setThread] = useState<Message[]>([]);
  const [timers, setTimers] = useState<Record<number, TimerState>>({});
  const [now, setNow] = useState(clock);
  const [eatenRaw, setEatenRaw] = useState<number | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The cook is a row of actions (Wash, Chop, Boil...), each with tasks to tick. Timers belong to timed tasks.
  const made = servingsMade && servingsMade > 0 ? servingsMade : (recipe?.servings ?? 1);
  const tiles = recipe ? processTiles(recipe, made) : [];
  const at = Math.min(cardIdx, Math.max(0, tiles.length - 1));
  const card = tiles[at];
  const timedTask = card?.tasks.find((t) => t.minutes && !doneTasks.includes(t.id)) ?? card?.tasks.find((t) => t.minutes);
  const timerKey = timedTask?.stepIndex ?? -1;
  const timer: TimerState | null = timedTask?.minutes ? (timers[timerKey] ?? newTimer(timedTask.minutes)) : null;
  const running = timer ? isRunning(timer) : false;

  // Re-render while a timer runs. The countdown itself reads the clock, so a slow tab stays accurate.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(clock()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const finished = timer ? isDone(timer, now) : false;
  const buzzed = useRef<number | null>(null);
  useEffect(() => {
    if (finished && buzzed.current !== timerKey) {
      buzzed.current = timerKey;
      navigator.vibrate?.([200, 100, 200]);
      // iOS has no vibration: say it, for hands that are busy and eyes that are not on the screen.
      speak("Time is up");
    }
  }, [finished, timerKey]);

  useWakeLock(phase !== "done");

  const toggleTimer = () => {
    if (!timer) return;
    const t = clock();
    setNow(t);
    setTimers((cur) => ({ ...cur, [timerKey]: isRunning(timer) ? pauseTimer(timer, t) : startTimer(timer, t) }));
  };
  const goNext = () => {
    if (at < tiles.length - 1) setCardIdx(at + 1);
    else setPhase("finish");
  };
  const goPrev = () => {
    if (phase === "finish") setPhase("cooking");
    else if (at > 0) setCardIdx(at - 1);
  };
  /** Done with this action: tick everything in it and move on. */
  const doneNext = () => {
    if (card) setDoneTasks((d) => [...new Set([...d, ...card.tasks.map((t) => t.id)])]);
    goNext();
  };
  const toggleTask = (id: string) => setDoneTasks((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  const firstOpen = card?.tasks.find((t) => !doneTasks.includes(t.id)) ?? card?.tasks[0];

  const onVoice = (c: VoiceCommand) => {
    if (phase !== "cooking" || !card) return;
    if (c === "next") doneNext();
    else if (c === "prev") goPrev();
    else if (c === "repeat") speak(firstOpen?.text ?? card.verb);
    else if (c === "timer-start" && timer && !isRunning(timer)) toggleTimer();
    else if (c === "timer-pause" && timer && isRunning(timer)) toggleTimer();
  };
  const voice = useVoiceCommands(onVoice);

  if (!recipes.data) return { isLoading: true as const };
  if (!recipe || !card) return { isLoading: false as const, notFound: true as const };

  const eaten = Math.min(made, eatenRaw ?? suggestedServings(habit.data ?? null));

  const pantryItems = pantryView.view.groups.flatMap((g) => g.items);
  // Questions follow the task being worked on (washing has no recipe step: ask about the first one).
  const stepIndex = (timedTask ?? firstOpen)?.stepIndex ?? card.tasks.find((t) => t.stepIndex !== undefined)?.stepIndex ?? 0;
  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const a = answerQuestion(q, { recipe, stepIndex, servings: made, pantry: pantryItems });
    setThread((t) => [...t, { id: t.length * 2, who: "you", text: q }, { id: t.length * 2 + 1, who: "guide", text: a.text }]);
  };
  const open = firstOpen?.stepIndex !== undefined ? stepGuide(recipe.steps[firstOpen.stepIndex]) : null;
  const guide = open ?? { look: "The water runs clear and nothing gritty is left.", tip: card.note ?? "Rinse under cold water." };
  const missing = ingredientStatus(recipe, pantryItems)
    .filter((x) => !x.inPantry)
    .map((x) => ({ name: x.ingredient.name, swap: swapsFor(recipe, x.ingredient.name)[0]?.use ?? null }));
  const prepItems = prepList(recipe, made);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await finishCooking({ pantry, logs, habits, leftovers, newId }, { recipe, servingsMade: made, servingsEaten: eaten, date: toDateKey(new Date()) });
      await Promise.all([qc.invalidateQueries({ queryKey: ["meal-logs"] }), qc.invalidateQueries({ queryKey: ["pantry"] }), qc.invalidateQueries({ queryKey: ["habit", id] }), qc.invalidateQueries({ queryKey: ["leftovers"] })]);
      setResult(r);
      setPhase("done");
      // Cooked it: it belongs in Recipes now. A failure here never undoes the logged meal.
      void my.save(recipe, true).catch(() => undefined);
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
    view,
    setView,
    /** The whole recipe in order, split by part. */
    full: recipeSections(recipe, made),
    /** The whole cook as a row of actions. Each has tasks to tick; an action is done when all are. */
    cards: tiles.map((t, i) => ({
      verb: t.verb,
      steps: t.steps,
      items: t.items,
      note: t.note ?? null,
      minutes: t.minutes ?? null,
      alongside: t.alongside,
      current: i === at,
      done: t.tasks.every((x) => doneTasks.includes(x.id)),
      go: () => setCardIdx(i),
      tasks: t.tasks.map((x) => ({ id: x.id, text: x.text, minutes: x.minutes ?? null, checked: doneTasks.includes(x.id), toggle: () => toggleTask(x.id) })),
    })),
    position: { number: at + 1, count: tiles.length, isFirst: at === 0, isLast: at === tiles.length - 1 },
    look: guide.look,
    tip: guide.tip,
    prep: {
      items: prepItems.map((i) => ({ ...i, checked: checked.includes(i.id), toggle: () => setChecked((c) => (c.includes(i.id) ? c.filter((x) => x !== i.id) : [...c, i.id])) })),
      done: prepItems.filter((i) => checked.includes(i.id)).length,
      total: prepItems.length,
      minutes: recipe.minutes,
      servings: made,
      missing,
    },
    ask: { open: askOpen, setOpen: setAskOpen, thread, send: ask, suggestions: suggestedQuestions(recipe, stepIndex) },
    next: doneNext,
    skip: goNext,
    prev: goPrev,
    timer: timer
      ? { label: formatRemaining(remainingMs(timer, now)), running, started: elapsedMs(timer, now) > 0, done: finished, toggle: toggleTimer }
      : null,
    voice,
    speakStep: () => speak(firstOpen?.text ?? card.verb),
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
