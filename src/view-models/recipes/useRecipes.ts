"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ingredientStatus, readiness, scaleQty, type Recipe } from "@/domain/recipes";
import { usePantry } from "../pantry/usePantry";
import { useRecipeRepo } from "./RecipeDeps";

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
  const { recipes, items } = useRecipeData();
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
    ready: `${rows.filter((x) => x.rd.missing === 0).length} you can cook right now`,
    filters: FILTERS.map((f) => ({ ...f, on: f.id === filter, pick: () => setFilter(f.id) })),
    query,
    setQuery,
    cards: shown.map(({ r, rd }) => ({ id: r.id, name: r.name, tint: r.tint, meta: `${r.minutes} min, ${r.kcal} kcal`, ready: rd.missing === 0, chip: rd.missing === 0 ? "Ready to cook" : `Missing ${rd.missing}` })),
  };
}

const fmtQty = (v: number) => {
  const w = Math.floor(v), fr = v - w;
  const f = fr === 0.25 ? "¼" : fr === 0.5 ? "½" : fr === 0.75 ? "¾" : "";
  return `${w || ""}${f}` || "0";
};

export function useRecipe(id: string) {
  const { recipes, items } = useRecipeData();
  const [servings, setServings] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [listed, setListed] = useState(false);
  if (!recipes) return { isLoading: true as const };
  const r: Recipe | undefined = recipes.find((x) => x.id === id);
  if (!r) return { isLoading: false as const, notFound: true as const };

  const sv = servings ?? r.servings;
  const status = ingredientStatus(r, items);
  const missing = status.filter((s) => !s.inPantry).length;
  return {
    isLoading: false as const,
    notFound: false as const,
    recipe: r,
    stats: [
      { label: "Time", value: `${r.minutes} min` },
      { label: "Per serving", value: `${r.kcal} kcal` },
      { label: "Protein", value: `${r.protein} g` },
    ],
    servings: sv,
    fewer: () => setServings(Math.max(1, sv - 1)),
    more: () => setServings(Math.min(12, sv + 1)),
    ingredients: status.map((s) => ({
      name: s.ingredient.name,
      amount: fmtQty(scaleQty(s.ingredient.qty, r.servings, sv)) + (s.ingredient.unit ? ` ${s.ingredient.unit}` : ""),
      inPantry: s.inPantry,
      tag: s.inPantry ? "In pantry" : listed ? "On list" : "Missing",
    })),
    missing,
    listed,
    toggleList: () => setListed(!listed),
    saved,
    toggleSave: () => setSaved(!saved),
  };
}
