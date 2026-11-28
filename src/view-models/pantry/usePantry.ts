"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  addNamesToShoppingList,
  addParsedItems,
  type Need,
  adjustQuantity,
  clampQty,
  getLowItems,
  hearUtterance,
  listPantry,
  toggleLowOnShoppingList,
  type ParsedItem,
  type PantryFilter,
  type PantryItem,
} from "@/domain/pantry";
import { usePantryDeps } from "./PantryDeps";

const PANTRY = ["pantry"];
const LIST = ["shopping-list"];

export function usePantry() {
  const { pantry, list, parser, newId } = usePantryDeps();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<PantryFilter>("all");

  const items = useQuery({ queryKey: PANTRY, queryFn: () => pantry.list() });
  const listIds = useQuery({ queryKey: LIST, queryFn: () => list.list() });

  const adjust = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) => adjustQuantity(pantry, id, delta),
    onMutate: async ({ id, delta }) => {
      await qc.cancelQueries({ queryKey: PANTRY });
      const prev = qc.getQueryData<PantryItem[]>(PANTRY);
      qc.setQueryData<PantryItem[]>(PANTRY, (xs) =>
        xs?.map((i) => (i.id === id ? { ...i, qty: clampQty(i.qty + delta) } : i)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(PANTRY, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: PANTRY }),
  });

  const hear = useMutation({ mutationFn: (text: string) => hearUtterance(parser, text) });

  const addHeard = useMutation({
    mutationFn: (parsed: ParsedItem[]) => addParsedItems({ repo: pantry, newId }, parsed),
    onSuccess: () => qc.invalidateQueries({ queryKey: PANTRY }),
  });

  const toggleList = useMutation({
    mutationFn: () => toggleLowOnShoppingList(pantry, list),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST }),
  });

  const addNames = useMutation({
    mutationFn: (needs: Need[]) => addNamesToShoppingList({ pantry, list, newId }, needs),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: LIST }), qc.invalidateQueries({ queryKey: PANTRY })]),
  });

  // The shopping list row goes first: a list row pointing at a deleted pantry item would linger.
  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      await list.remove(ids);
      await pantry.remove(ids);
    },
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: PANTRY }), qc.invalidateQueries({ queryKey: LIST })]),
  });

  const all = items.data ?? [];
  const lowIds = getLowItems(all).map((i) => i.id);
  const onList = new Set(listIds.data ?? []);

  return {
    isLoading: items.isLoading,
    error: items.error,
    view: listPantry(all, filter),
    filter,
    setFilter,
    /** True when every running-low item is already on the shopping list. */
    listed: lowIds.length > 0 && lowIds.every((id) => onList.has(id)),
    adjust: (id: string, delta: number) => adjust.mutate({ id, delta }),
    hear: (text: string) => hear.mutateAsync(text),
    addHeard: (parsed: ParsedItem[]) => addHeard.mutateAsync(parsed),
    /** Ids of pantry items that are on the shopping list. */
    onListIds: onList,
    toggleList: () => toggleList.mutate(),
    addNames: (needs: Need[]) => addNames.mutateAsync(needs),
    remove: (id: string) => remove.mutate([id]),
  };
}
