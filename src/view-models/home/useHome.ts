"use client";
import { useMemo, useState } from "react";
import { dayFromRecipes, leftKcal } from "@/domain/dashboard";
import { buildFeed, summarizeEvents, type FeedItem } from "@/domain/feed";
import { toDateKey } from "@/domain/nutrition";
import { isLow } from "@/domain/pantry";
import { readiness, type MealName, type Recipe } from "@/domain/recipes";
import { buildChartModel, num, type Range } from "../dashboard/chartModel";
import { joinList } from "../format";
import { usePantry } from "../pantry/usePantry";
import { useFeedStats, useFeedTracker } from "../feed/useFeedTracker";
import { usePlanData } from "../plan/usePlanData";

export function useHome() {
  const data = usePlanData("balanced");
  const pantry = usePantry();
  const stats = useFeedStats();
  const track = useFeedTracker();
  const [eaten, setEaten] = useState<MealName[] | null>(null);
  const [range, setRange] = useState<Range>("7d");
  // One timestamp per visit: the feed is built once, so it does not reshuffle while you scroll.
  const [now] = useState(() => Date.now());

  // Today is built from the meals actually eaten, so marking one eaten moves the chart's last point too.
  const core = useMemo(() => {
    if (!data) return null;
    const { recipes, dashboard, plan } = data;
    const byId = new Map(recipes.map((r) => [r.id, r]));
    const eatenNow = eaten ?? dashboard.eatenToday;
    const todayMeals = plan[0].meals.map((m) => ({ meal: m.meal, recipe: byId.get(m.recipeId) as Recipe }));
    const todayDay = dayFromRecipes(
      dashboard.days[dashboard.days.length - 1].date,
      dashboard.goals.calories,
      todayMeals.filter((m) => eatenNow.includes(m.meal)).map((m) => m.recipe),
    );
    const days = [...dashboard.days.slice(0, -1), todayDay];
    const chart = buildChartModel(range === "7d" ? days.slice(-7) : days, range);
    return { eatenNow, todayMeals, todayDay, chart, goals: dashboard.goals, notes: data.balance.notes };
  }, [data, eaten, range]);

  if (!core || !stats) return { isLoading: true as const };
  const { eatenNow, todayMeals, todayDay, goals } = core;
  const pantryItems = pantry.view.groups.flatMap((g) => g.items);
  const toggleEaten = (meal: MealName) => setEaten(eatenNow.includes(meal) ? eatenNow.filter((x) => x !== meal) : [...eatenNow, meal]);

  const open = todayMeals.filter((m) => !eatenNow.includes(m.meal));
  const card = (m: (typeof todayMeals)[number]) => {
    const rd = readiness(m.recipe, pantryItems);
    return {
      meal: m.meal,
      id: m.recipe.id,
      name: m.recipe.name,
      minutes: m.recipe.minutes,
      kcal: m.recipe.kcal,
      protein: m.recipe.protein,
      tint: m.recipe.tint,
      ready: rd.missing === 0,
      readyText: rd.missing === 0 ? "Ready to cook" : `Missing ${rd.missing}`,
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
    lowItems: lowItems.length,
    planNotes: problems,
    stats: stats ?? summarizeEvents([], now),
  });

  return {
    isLoading: false as const,
    feed: { items: feed.items as FeedItem[], track },
    dateLabel: new Date(now).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    next: open[0] ? card(open[0]) : null,
    then: open.slice(1).map((m) => ({ id: m.recipe.id, meal: m.meal, name: m.recipe.name })),
    chart: { ...core.chart, range, setRange },
    today: {
      eatenValue: todayDay.eaten,
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
