"use client";
import { useState } from "react";
import { isLow, pictureFor, type ParsedItem } from "@/domain/pantry";
import { joinList } from "../format";
import { usePantry } from "./usePantry";
import { useSpeech } from "./useSpeech";

type Mode = "idle" | "listening" | "heard";

const spoken = (items: { name: string; qty: number }[]) =>
  joinList(items.map((i) => (i.qty > 1 ? `${i.qty} ${i.name.toLowerCase()}` : i.name.toLowerCase())));

export function usePantryScreen() {
  const p = usePantry();
  const [heard, setHeard] = useState<{ text: string; items: ParsedItem[] } | null>(null);
  const [added, setAdded] = useState<string | null>(null);

  const speech = useSpeech(async (text) => {
    const items = await p.hear(text);
    setHeard(items.length ? { text, items } : null);
  });

  const mode: Mode = heard ? "heard" : speech.listening ? "listening" : "idle";

  const groups = p.view.groups.map((g) => ({
    name: g.name,
    rows: g.items.map((i) => ({ id: i.id, name: i.name, image: pictureFor(i.name), qtyText: `${i.qty} ${i.unit}`, low: isLow(i), out: i.qty <= 0 })),
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
