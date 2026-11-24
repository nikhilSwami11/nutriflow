"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { dietOf } from "@/domain/eat";
import { cookability } from "@/domain/guide";
import { ingredientStatus, readiness, scaleQty, weightOf, type Recipe } from "@/domain/recipes";
import { usePantry } from "../pantry/usePantry";
import { useRecipeRepo } from "./RecipeDeps";
import { useHave } from "../pantry/useHave";
import { useMyRecipes } from "./useMyRecipes";
import { savedOnly } from "@/domain/recipes";

export type Filter = "all" | "pantry" | "quick" | "protein";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pantry", label: "From your pantry" },
  { id: "quick", label: "Under 30 min" },
  { id: "protein", label: "High protein" },
];

function useRecipeData() {
  const repo = useRecipeRepo();
  const pantry = usePantry();
  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => repo.list() });
  return { recipes: recipes.data, items: pantry.view.groups.flatMap((g) => g.items), pantry };
}

export function useRecipes() {
  const { items } = useRecipeData();
  const my = useMyRecipes();
  // The Recipes tab is only what this person kept: saved, or cooked. New meals come from "What should I eat?".
  const recipes = my.isLoading ? undefined : savedOnly(my.list);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  if (!recipes) return { isLoading: true as const };

  const rows = recipes.map((r) => ({ r, rd: readiness(r, items) }));
  const shown = rows.filter(({ r, rd }) => {
    const byFilter = filter === "all" || (filter === "pantry" && rd.have > 0 && rd.missing <= 1) || (filter === "quick" && r.minutes <= 30) || (filter === "protein" && r.protein >= 22);
    return byFilter && (!query || r.name.toLowerCase().includes(query.toLowerCase()));
  });
  return {
    isLoading: false as const,
    empty: recipes.length === 0,
    ready: `${rows.filter((x) => x.rd.missing === 0).length} ready to cook`,
    filters: FILTERS.map((f) => ({ ...f, on: f.id === filter, pick: () => setFilter(f.id) })),
    query,
    setQuery,
    cards: shown.map(({ r, rd }) => ({ id: r.id, name: r.name, tint: r.tint, image: r.image, meta: `${r.minutes} min, ${r.kcal} kcal`, ready: rd.missing === 0, chip: rd.missing === 0 ? "Ready to cook" : `Missing ${rd.missing}` })),
  };
}

const fmtQty = (v: number) => {
  const w = Math.floor(v), fr = v - w;
  const f = fr === 0.25 ? "¼" : fr === 0.5 ? "½" : fr === 0.75 ? "¾" : "";
  return `${w || ""}${f}` || "0";
};

export function useRecipe(id: string) {
  const { recipes, items } = useRecipeData();
  const my = useMyRecipes();
  const have = useHave();
  const [servings, setServings] = useState<number | null>(null);
  const [listed, setListed] = useState(false);
  if (!recipes) return { isLoading: true as const };
  const r: Recipe | undefined = recipes.find((x) => x.id === id);
  if (!r) return { isLoading: false as const, notFound: true as const };

  const sv = servings ?? r.servings;
  const status = ingredientStatus(r, items);
  const missing = status.filter((s) => !s.inPantry).length;
  const cook = cookability(r, items);
  const swapOf = new Map(cook.swaps.map((x) => [x.name, x.use]));
  const DIET = { vegan: "Vegan", vegetarian: "Vegetarian", egg: "Contains egg", nonveg: "Non-veg" } as const;
  return {
    isLoading: false as const,
    notFound: false as const,
    recipe: r,
    stats: [
      { label: "Time", value: `${r.minutes} min` },
      { label: "Per serving", value: `${r.kcal} kcal` },
      { label: "Protein", value: `${r.protein} g` },
      { label: "Carbs", value: `${r.carbs} g` },
      { label: "Fat", value: `${r.fat} g` },
      { label: "Diet", value: DIET[dietOf(r)] },
    ],
    /** One plain line for what stands between you and cooking, like Home. */
    cookLine: cook.state === "check" ? "Tell me what you have and I will work out what is missing" : missing === 0 ? "Everything is in your pantry" : cook.canCook ? "You can cook this now with swaps or skips" : `Missing ${cook.needed.map((x) => x.name.toLowerCase()).join(", ")}`,
    servings: sv,
    fewer: () => setServings(Math.max(1, sv - 1)),
    more: () => setServings(Math.min(12, sv + 1)),
    ingredients: status.map((s) => ({
      name: s.ingredient.name,
      amount: fmtQty(scaleQty(s.ingredient.qty, r.servings, sv)) + (s.ingredient.unit ? ` ${s.ingredient.unit}` : ""),
      /** About how much it weighs, gray on the right: "400 g dry". Null when unknown. */
      weight: weightOf(s.ingredient, scaleQty(s.ingredient.qty, r.servings, sv)),
      inPantry: s.inPantry,
      /** The pantry may be wrong: let the person say they have it. */
      iHave: () => void have.have({ name: s.ingredient.name, qty: scaleQty(s.ingredient.qty, r.servings, sv), unit: s.ingredient.unit }),
      tag: s.inPantry ? "In pantry" : swapOf.has(s.ingredient.name) ? "Swap" : cook.skips.includes(s.ingredient.name) ? "Optional" : listed ? "On list" : "Missing",
      /** What to use instead, when you own a stand-in. */
      note: swapOf.has(s.ingredient.name) ? `Use ${swapOf.get(s.ingredient.name)}` : null,
    })),
    missing,
    listed,
    toggleList: () => setListed(!listed),
    saved: my.isSaved(r.id),
    toggleSave: () => void my.save(r, !my.isSaved(r.id)).catch(() => undefined),
  };
}
