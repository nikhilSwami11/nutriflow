"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { dayFromMeals, leftKcal } from "@/domain/dashboard";
import { logRecipeEaten } from "@/domain/cooking";
import { buildFeed, summarizeEvents, type FeedItem } from "@/domain/feed";
import { toDateKey } from "@/domain/nutrition";
import { isLow } from "@/domain/pantry";
import { eatNext as pickNext, prepTasks, upcomingMeals } from "@/domain/planning";
import { shopUnitFor } from "@/domain/shopping";
import { cookability, swapsFor } from "@/domain/guide";
import type { MealName, Recipe } from "@/domain/recipes";
import { buildChartModel, num, type Range } from "../dashboard/chartModel";
import { joinList } from "../format";
import { useChores } from "../chores/useChores";
import { usePantry } from "../pantry/usePantry";
import type { StoryModel } from "../feed/storyModel";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { useStoriesSeen } from "../feed/useStoriesSeen";
import { useFeedStats, useFeedTracker } from "../feed/useFeedTracker";
import { usePlanData } from "../plan/usePlanData";

export const MEAL_OF_SLOT = { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" } as const;
const SLOT_OF_MEAL = { Breakfast: "breakfast", Lunch: "lunch", Snack: "snack", Dinner: "dinner" } as const;

/** The first stand-in we know for an ingredient, as one line. */
export const swapText = (recipe: Parameters<typeof swapsFor>[0], name: string): string | null => {
  const s = swapsFor(recipe, name)[0];
  return s ? `${s.use}.${s.note ? ` ${s.note}` : ""}` : null;
};

export function useHome() {
  const data = usePlanData();
  const pantry = usePantry();
  const chores = useChores();
  // When "Start doing" was tapped, per chore, this visit only.
  const [started, setStarted] = useState<Record<string, number>>({});
  const stats = useFeedStats();
  const { logs, prep: prepRepo } = useNutritionDeps();
  const track = useFeedTracker();
  const { seen, markSeen } = useStoriesSeen();
  const qc = useQueryClient();
  const [range, setRange] = useState<Range>("7d");
  // Recipes whose missing things went onto the shopping list this visit.
  const [listed, setListed] = useState<string[]>([]);
  // One timestamp per visit: the feed is built once, so it does not reshuffle while you scroll.
  const [now] = useState(() => Date.now());

  // Meals logged today (cooked, photographed, marked eaten, or told to a chat). Only the offline demo adds more.
  const [today] = useState(() => toDateKey(new Date()));
  const todayLogs = useQuery({ queryKey: ["meal-logs", today], queryFn: () => logs.listBetween(today, today) });
  // Prep ticks live in the account (the chat sees them too); a failed read just shows nothing ticked.
  const prepDone = useQuery({ queryKey: ["prep-done", today], queryFn: () => prepRepo.doneOn(today).catch(() => [] as string[]) });
  const setPrep = async (id: string, done: boolean) => {
    qc.setQueryData<string[]>(["prep-done", today], (cur = []) => (done ? [...cur, id] : cur.filter((x) => x !== id)));
    await prepRepo.set(id, done).catch(() => qc.invalidateQueries({ queryKey: ["prep-done", today] }));
  };

  // Today is built from the meals actually eaten, so marking one eaten moves the chart's last point too.
  const core = useMemo(() => {
    if (!data) return null;
    const { recipes, dashboard, plan } = data;
    const byId = new Map(recipes.map((r) => [r.id, r]));
    const logged = new Map((todayLogs.data ?? []).map((l) => [MEAL_OF_SLOT[l.slot], l]));
    const eatenNow = [...new Set([...dashboard.eatenToday, ...logged.keys()])];
    const todayMeals = plan[0].meals.map((m) => ({ meal: m.meal, recipe: byId.get(m.recipeId) as Recipe }));
    const tomorrowMeals = (plan[1]?.meals ?? []).map((m) => ({ meal: m.meal, recipe: byId.get(m.recipeId) as Recipe }));
    const todayDay = dayFromMeals(
      dashboard.days[dashboard.days.length - 1].date,
      dashboard.goals.calories,
      todayMeals.filter((m) => eatenNow.includes(m.meal)).map((m) => {
        const l = logged.get(m.meal);
        if (!l) return m.recipe;
        const k = m.recipe.kcal ? l.kcal / m.recipe.kcal : 1; // a log without macros borrows the recipe's, scaled
        return { kcal: l.kcal, protein: l.protein ?? m.recipe.protein * k, carbs: l.carbs ?? m.recipe.carbs * k, fat: l.fat ?? m.recipe.fat * k };
      }),
    );
    const days = [...dashboard.days.slice(0, -1), todayDay];
    const chart = buildChartModel(range === "7d" ? days.slice(-7) : days, range);
    return { logged, eatenNow, todayMeals, tomorrowMeals, todayDay, chart, goals: dashboard.goals, notes: data.balance.notes };
  }, [data, range, todayLogs.data]);

  if (!core || !stats) return { isLoading: true as const };
  const { eatenNow, todayMeals, tomorrowMeals, todayDay, goals } = core;
  const pantryItems = pantry.view.groups.flatMap((g) => g.items);
  // Mark eaten logs one serving, so it survives a reload and every device and the chat see it; unmarking removes that log.
  const toggleEaten = async (meal: MealName, recipe: Recipe) => {
    const log = core.logged.get(meal);
    if (log) await logs.remove(log.id);
    else if (!eatenNow.includes(meal)) await logRecipeEaten(logs, { id: crypto.randomUUID(), date: today, slot: SLOT_OF_MEAL[meal], recipe, source: "cook" });
    await qc.invalidateQueries({ queryKey: ["meal-logs"] });
  };

  // What to eat next goes by the clock: a skipped breakfast is not offered at lunch time.
  const hour = new Date(now).getHours();
  const open = upcomingMeals(todayMeals, eatenNow, hour);
  const card = (m: (typeof todayMeals)[number]) => {
    const cook = cookability(m.recipe, pantryItems);
    const missing = cook.needed.map((x) => ({ name: x.name, qty: x.qty, unit: shopUnitFor(x.unit) }));
    const n = missing.length;
    const count = (k: number, w: string) => `${k} ${w}${k === 1 ? "" : "s"}`;
    const easy = [cook.swaps.length ? count(cook.swaps.length, "swap") : "", cook.skips.length ? count(cook.skips.length, "skip") : ""].filter(Boolean);
    const onList = listed.includes(m.recipe.id);
    // Main things we cannot be sure of: ask the person instead of claiming they are missing.
    const ask = [...cook.unknown, ...cook.needed].map((x) => ({ name: x.name, qty: x.qty, unit: x.unit, swap: swapText(m.recipe, x.name) }));
    return {
      meal: m.meal,
      id: m.recipe.id,
      name: m.recipe.name,
      minutes: m.recipe.minutes,
      kcal: m.recipe.kcal,
      protein: m.recipe.protein,
      tint: m.recipe.tint,
      image: m.recipe.image,
      /** Nothing blocks cooking: all there, or every gap has a stand-in at home or can be skipped. */
      ready: cook.canCook,
      /** Plain words for what stands between you and dinner. */
      state: cook.state,
      ask,
      assumed: cook.assumed,
      readyText: cook.state === "check" ? "Check what you have" : !cook.canCook ? `You are missing ${count(n, "thing")}` : easy.length ? `Can cook with ${easy.join(" and ")}` : "Ready to cook",
      /** The one main action: cook when nothing blocks, else shop for what is needed. */
      actionText: cook.canCook ? "Start cooking" : cook.state === "check" ? "Check ingredients" : onList ? `${n} on your shopping list` : `Add ${n} to shopping`,
      actionDone: n > 0 && onList,
      addMissing: async () => {
        await pantry.addNames(missing);
        setListed((l) => [...l, m.recipe.id]);
      },
      toggle: () => void toggleEaten(m.meal, m.recipe),
    };
  };
  const lowItems = pantryItems.filter(isLow);

  // The feed decides which posts, in what order. The data inside each post stays live on the client.
  const nextOpen = open[0];
  // The same rule the chat's eat_next uses.
  const eatNext = pickNext({ today: todayMeals, tomorrow: tomorrowMeals, eaten: eatenNow, hour, pantry: pantryItems });
  const date = toDateKey(new Date(now));
  const prep = prepTasks(date, open.map((m) => m.recipe), tomorrowMeals.map((m) => m.recipe));
  const problems = core.notes.filter((n) => !n.startsWith("Every day lands"));
  const feed = buildFeed({
    date,
    now,
    nextMeal: nextOpen ? { meal: nextOpen.meal, recipeId: nextOpen.recipe.id } : null,
    eatNext: eatNext ? { meal: eatNext.meal, recipeId: eatNext.recipe.id, tomorrow: !nextOpen } : null,
    prep: prep.length,
    chores: chores.todays.map((c) => ({ id: c.id })),
    lowItems: lowItems.length,
    planNotes: problems,
    stats: stats ?? summarizeEvents([], now),
  });

  const stories = (feed.stories ?? []).flatMap<StoryModel>((st) => {
    const isSeen = seen.includes(st.id);
    if (st.kind === "meal") {
      if (!eatNext) return [];
      const c = card(eatNext);
      const today = !st.tomorrow;
      const meal = { ...c, when: today ? "" : "Tomorrow", toggle: today ? c.toggle : undefined };
      return [{ id: st.id, kind: "meal", label: "Eat next", seen: isSeen, tint: c.tint, meal }];
    }
    if (st.kind === "prep") {
      const tasks = prep.map((t) => {
        const done = (prepDone.data ?? []).includes(t.id);
        const sub = `${t.due === "now" ? "Now" : "Tonight"}, for ${t.dish.toLowerCase()} ${t.forDay}`;
        return { id: t.id, action: t.action, sub, done, toggle: () => void setPrep(t.id, !done) };
      });
      return tasks.length ? [{ id: st.id, kind: "prep", label: "Prep", seen: isSeen, tint: "var(--sky)", tasks }] : [];
    }
    if (st.kind === "chore") {
      const c = chores.todays.find((x) => x.id === st.choreId);
      if (!c) return [];
      const chore = {
        id: c.id, title: c.title, when: c.when, done: c.done, startedAt: started[c.id] ?? null,
        start: () => setStarted((m) => ({ ...m, [c.id]: Date.now() })),
        complete: () => chores.setDone(c.id, true),
        undo: () => { chores.setDone(c.id, false); setStarted((m) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== c.id))); },
      };
      return [{ id: st.id, kind: "chore", label: c.title, seen: isSeen, tint: "var(--butter-soft)", chore }];
    }
    if (st.kind === "pantry") {
      return lowItems.length
        ? [{ id: st.id, kind: "pantry", label: "Pantry", seen: isSeen, tint: "var(--peach)", rows: lowItems.slice(0, 4).map((i) => ({ id: i.id, name: i.name, qty: `${i.qty} ${i.unit}` })), listed: pantry.listed, toggleList: pantry.toggleList }]
        : [];
    }
    return [{ id: st.id, kind: "plan", label: "Plan", seen: isSeen, tint: "var(--lavender-soft)", notes: st.notes }];
  });

  return {
    isLoading: false as const,
    stories: {
      items: stories,
      /** Opening marks it seen and tells the feed. */
      open: (id: string, position: number) => {
        markSeen(id);
        track({ id, kind: "story" }, "open", position);
      },
      track: (id: string, action: "mark-eaten" | "add-to-list" | "open", position: number) => track({ id, kind: "story" }, action, position),
    },
    feed: { items: feed.items as FeedItem[], track },
    dateLabel: new Date(now).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    next: open[0] ? card(open[0]) : null,
    then: open.slice(1).map((m) => ({ id: m.recipe.id, meal: m.meal, name: m.recipe.name })),
    chart: { ...core.chart, range, setRange },
    today: {
      eatenValue: todayDay.eaten,
      goalValue: goals.calories,
      goal: num(goals.calories),
      left: `${num(leftKcal(goals.calories, todayDay.eaten))} left`,
      macros: [
        { label: "Protein", value: todayDay.macros.protein, goal: goals.protein, color: "var(--rose)" },
        { label: "Carbs", value: todayDay.macros.carbs, goal: goals.carbs, color: "var(--sky)" },
        { label: "Fat", value: todayDay.macros.fat, goal: goals.fat, color: "var(--lavender)" },
      ].map((m) => ({ ...m, pct: Math.min(100, (m.value / m.goal) * 100) })),
    },
    pantry: lowItems.length
      ? {
          text: joinList(lowItems.slice(0, 3).map((i) => i.name.toLowerCase())),
          more: Math.max(0, lowItems.length - 3),
          count: lowItems.length,
          rows: lowItems.slice(0, 3).map((i) => ({ id: i.id, name: i.name, qty: `${i.qty} ${i.unit}`, pct: i.lowAt > 0 ? Math.min(100, (i.qty / (i.lowAt * 2)) * 100) : 0 })),
          listed: pantry.listed,
          toggle: pantry.toggleList,
        }
      : null,
  };
}
export type HomeModel = Extract<ReturnType<typeof useHome>, { isLoading: false }>;
