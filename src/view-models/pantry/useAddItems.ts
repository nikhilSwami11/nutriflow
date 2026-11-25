"use client";
import { useState } from "react";
import { listAsText, suggestItems } from "@/domain/pantry";
import { usePantry } from "./usePantry";

export interface Tile {
  name: string;
  image?: string;
  selected: boolean;
}

/** Add by hand: tap squares to select, then add them to the pantry or export the selection as a list. */
export function useAddItems() {
  const p = usePantry();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const all = p.view.groups.flatMap((g) => g.items);
  const shown = suggestItems(all, query);
  const tiles: Tile[] = shown.map((x) => ({ name: x.name, image: x.image, selected: picked.includes(x.name) }));

  return {
    query,
    setQuery,
    tiles,
    count: picked.length,
    toggle: (name: string) => setPicked((l) => (l.includes(name) ? l.filter((x) => x !== name) : [...l, name])),
    clear: () => setPicked([]),
    text: listAsText(picked),
    names: picked,
    add: async () => {
      const chosen = suggestItems([], "").filter((x) => picked.includes(x.name));
      await p.addHeard(chosen.map((x) => ({ name: x.name.toLowerCase(), qty: x.qty, unit: x.unit, group: x.group })));
      setPicked([]);
      return chosen.length;
    },
  };
}
