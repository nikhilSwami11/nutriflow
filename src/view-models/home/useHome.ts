"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { dayFromMeals, leftKcal } from "@/domain/dashboard";
import { buildFeed, summarizeEvents, type FeedItem } from "@/domain/feed";
import { toDateKey } from "@/domain/nutrition";
import { isLow } from "@/domain/pantry";
import { shopUnitFor } from "@/domain/shopping";
import { ingredientStatus, type MealName, type Recipe } from "@/domain/recipes";
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

export function useHome() {
  const data = usePlanData("balanced");
  const pantry = usePantry();
  const chores = useChores();
  // When "Start doing" was tapped, per chore, this visit only.
  const [started, setStarted] = useState<Record<string, number>>({});
  const stats = useFeedStats();
  const { logs } = useNutritionDeps();
  const track = useFeedTracker();
  const { seen, markSeen } = useStoriesSeen();
  const [eaten, setEaten] = useState<MealName[] | null>(null);
  const [range, setRange] = useState<Range>("7d");
  // Recipes whose missing things went onto the shopping list this visit.
  const [listed, setListed] = useState<string[]>([]);
  // One timestamp per visit: the feed is built once, so it does not reshuffle while you scroll.
  const [now] = useState(() => Date.now());

  // Meals really logged today (cooked, later photographed). They win over the demo and the local toggles.
  const [today] = useState(() => toDateKey(new Date()));
  const todayLogs = useQuery({ queryKey: ["meal-logs", today], queryFn: () => logs.listBetween(today, today) });

  // Today is built from the meals actually eaten, so marking one eaten moves the chart's last point too.
  const core = useMemo(() => {
    if (!data) return null;
    const { recipes, dashboard, plan } = data;
    const byId = new Map(recipes.map((r) => [r.id, r]));
    const logged = new Map((todayLogs.data ?? []).map((l) => [MEAL_OF_SLOT[l.slot], l]));
    const eatenNow = [...new Set([...(eaten ?? dashboard.eatenToday), ...logged.keys()])];
    const todayMeals = plan[0].meals.map((m) => ({ meal: m.meal, recipe: byId.get(m.recipeId) as Recipe }));
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
    return { eatenNow, todayMeals, todayDay, chart, goals: dashboard.goals, notes: data.balance.notes };
  }, [data, eaten, range, todayLogs.data]);

  if (!core || !stats) return { isLoading: true as const };
  const { eatenNow, todayMeals, todayDay, goals } = core;
  const pantryItems = pantry.view.groups.flatMap((g) => g.items);
  // A meal that is really logged stays eaten; the toggle only moves the demo ones.
  const toggleEaten = (meal: MealName) => setEaten(eatenNow.includes(meal) ? eatenNow.filter((x) => x !== meal) : [...eatenNow, meal]);

  const open = todayMeals.filter((m) => !eatenNow.includes(m.meal));
  const card = (m: (typeof todayMeals)[number]) => {
    const missing = ingredientStatus(m.recipe, pantryItems).filter((x) => !x.inPantry).map((x) => ({ name: x.ingredient.name, qty: x.ingredient.qty, unit: shopUnitFor(x.ingredient.unit) }));
    const n = missing.length;
    const onList = listed.includes(m.recipe.id);
    return {
      meal: m.meal,
      id: m.recipe.id,
      name: m.recipe.name,
      minutes: m.recipe.minutes,
      kcal: m.recipe.kcal,
      protein: m.recipe.protein,
      tint: m.recipe.tint,
      ready: n === 0,
      /** Plain words for what stands between you and dinner. */
      readyText: n === 0 ? "Ready to cook" : `You are missing ${n} ${n === 1 ? "thing" : "things"}`,
      /** The one main action: shop for what is missing, or cook. */
      actionText: n === 0 ? "Start cooking" : onList ? `${n} on your shopping list` : `Add ${n} to shopping`,
      actionDone: n > 0 && onList,
      addMissing: async () => {
        await pantry.addNames(missing);
        setListed((l) => [...l, m.recipe.id]);
      },
      toggle: () => toggleEaten(m.meal),
    };
  };
  const lowItems = pantryItems.filter(isLow);

  // The feed decides which posts, in what order. The data inside each post stays live on the client.
  const nextOpen = open[0];
  const problems = core.notes.filter((n) => !n.startsWith("Every day lands"));
  const feed = buildFeed({
    date: toDateKey(new Date(now)),
    now,
    nextMeal: nextOpen ? { meal: nextOpen.meal, recipeId: nextOpen.recipe.id } : null,
    meals: todayMeals.map((m) => ({ meal: m.meal, recipeId: m.recipe.id })),
    chores: chores.todays.map((c) => ({ id: c.id })),
    lowItems: lowItems.length,
    planNotes: problems,
    stats: stats ?? summarizeEvents([], now),
  });

  const mealCards = new Map(todayMeals.map((m) => [m.meal, card(m)]));
  const stories = (feed.stories ?? []).flatMap<StoryModel>((st) => {
    const isSeen = seen.includes(st.id);
    if (st.kind === "meal") {
      const c = mealCards.get(st.meal);
      if (!c) return [];
      const state = eatenNow.includes(st.meal) ? ("eaten" as const) : nextOpen?.meal === st.meal ? ("next" as const) : ("later" as const);
      return [{ id: st.id, kind: "meal", label: st.meal, seen: isSeen, tint: c.tint, meal: { ...c, state } }];
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
      return [{ id: st.id, kind: "chore", label: c.title, seen: isSeen, tint: "#FBE3A6", chore }];
    }
    if (st.kind === "pantry") {
      return lowItems.length
        ? [{ id: st.id, kind: "pantry", label: "Pantry", seen: isSeen, tint: "#F7C9BB", rows: lowItems.slice(0, 4).map((i) => ({ id: i.id, name: i.name, qty: `${i.qty} ${i.unit}` })), listed: pantry.listed, toggleList: pantry.toggleList }]
        : [];
    }
    return [{ id: st.id, kind: "plan", label: "Plan", seen: isSeen, tint: "#CFC8F0", notes: st.notes }];
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
        { label: "Protein", value: todayDay.macros.protein, goal: goals.protein, color: "#F2A3A9" },
        { label: "Carbs", value: todayDay.macros.carbs, goal: goals.carbs, color: "#9EC8F3" },
        { label: "Fat", value: todayDay.macros.fat, goal: goals.fat, color: "#B9A7EE" },
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
