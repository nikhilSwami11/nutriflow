"use client";
import { useMemo, useState } from "react";
import { toDateKey } from "@/domain/nutrition";
import { isLow, pictureFor, type ParsedItem } from "@/domain/pantry";
import { neededForPlan } from "@/domain/shopping";
import { joinList } from "../format";
import { usePlanData } from "../plan/usePlanData";
import { usePantry } from "./usePantry";
import { useSpeech } from "./useSpeech";

type Mode = "idle" | "listening" | "heard";

const spoken = (items: { name: string; qty: number }[]) =>
  joinList(items.map((i) => (i.qty > 1 ? `${i.qty} ${i.name.toLowerCase()}` : i.name.toLowerCase())));

export function usePantryScreen() {
  const p = usePantry();
  const [heard, setHeard] = useState<{ text: string; items: ParsedItem[] } | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [typed, setTyped] = useState("");
  const plan = usePlanData();
  const allItems = p.view.groups.flatMap((g) => g.items);
  const [today] = useState(() => toDateKey(new Date()));
  // What the next planned days need that the pantry does not have at all. An empty pantry is unknown, not bare.
  const needed = useMemo(() => {
    if (!plan || !allItems.length) return [];
    return neededForPlan({ plan: plan.plan, recipes: plan.recipes, pantry: allItems, today, eatenToday: plan.dashboard.eatenToday });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allItems is rebuilt each render from p.view
  }, [plan, p.view, today]);

  const speech = useSpeech(async (text) => {
    const items = await p.hear(text);
    setHeard(items.length ? { text, items } : null);
  });

  const mode: Mode = heard ? "heard" : speech.listening ? "listening" : "idle";

  const groups = p.view.groups.map((g) => ({
    name: g.name,
    rows: g.items.map((i) => ({ id: i.id, name: i.name, image: pictureFor(i.name), qtyText: `${i.qty} ${i.unit}`, low: isLow(i), out: i.qty <= 0, unit: i.unit, onList: p.onListIds.has(i.id) })),
  }));

  return {
    isLoading: p.isLoading,
    countText: `${p.view.total} items, ${p.view.lowCount} running low`,
    lowCount: p.view.lowCount,
    lowSub: (() => {
      const names = p.view.groups.flatMap((g) => g.items).filter(isLow).map((i) => i.name);
      return names.slice(0, 3).join(", ") + (names.length > 3 ? " and more" : "");
    })(),
    listed: p.listed,
    toggleList: p.toggleList,
    filter: p.filter,
    setFilter: p.setFilter,
    filterCounts: { all: p.view.total, low: p.view.lowCount },
    groups,
    editing,
    toggleEditing: () => setEditing((e) => !e),
    remove: p.remove,
    needed: needed.map((n) => ({ name: n.name, amount: `${n.qty ?? 1} ${n.unit ?? "pcs"}`, need: n })),
    /** Puts a short or needed thing on the shopping list, by name. */
    addToList: (need: { name: string; qty?: number; unit?: (typeof needed)[number]["unit"] }) => p.addNames([need]),
    /** Type what you have ("2 onions and milk"): added at once, since you wrote it yourself. */
    typed,
    setTyped,
    typeAdd: async () => {
      const text = typed.trim();
      if (!text) return;
      const items = await p.hear(text);
      if (!items.length) {
        setAdded("I could not find a food in that. Try “2 onions”.");
        return;
      }
      await p.addHeard(items);
      setAdded(`Added ${spoken(items)}.`);
      setTyped("");
    },
    adjust: p.adjust,
    voice: {
      mode,
      added,
      heardText: heard?.text ?? "",
      heardChips: (heard?.items ?? []).map((i) => ({ name: i.name[0].toUpperCase() + i.name.slice(1), qty: `+${i.qty}` })),
      tapMic: () => {
        if (mode === "idle") {
          setAdded(null);
          speech.start();
        }
      },
      redo: () => setHeard(null),
      addHeard: async () => {
        if (!heard) return;
        const items = heard.items;
        await p.addHeard(items);
        setAdded(`Pantry updated. I added ${spoken(items)}.`);
        setHeard(null);
      },
    },
  };
}
