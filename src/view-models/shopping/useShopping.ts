"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { addNamesToShoppingList, DEFAULT_AMOUNT, type Amount } from "@/domain/pantry";
import { toDateKey } from "@/domain/nutrition";
import {
  clampAmount,
  formatQty,
  isZip,
  markBought,
  neededForPlan,
  recentlyBought,
  STORES,
  stepOf,
  storeSearchUrl,
  unmarkBought,
  withBought,
  withoutBought,
  type ShoppingPrefs,
  type StoreId,
} from "@/domain/shopping";
import { MEAL_OF_SLOT } from "../home/useHome";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { usePantryDeps } from "../pantry/PantryDeps";
import { usePlanData } from "../plan/usePlanData";
import { useShoppingDeps } from "./ShoppingDeps";

// Presentation cannot import the domain: these reach it from here.
export { STORES, isZip };
export type { StoreId };

const PANTRY = ["pantry"];
const LIST = ["shopping-list"];
const PREFS = ["shopping-prefs"];
const AMOUNTS = ["shopping-amounts"];
const BOUGHT = ["shopping-bought"];

export interface ShoppingRow {
  id: string;
  name: string;
  /** Opens the chosen store's search for this item; null until a store is chosen. */
  storeUrl: string | null;
  storeName: string | null;
  amount: Amount;
  /** "2 kg" */
  amountText: string;
  /** "2" */
  qtyText: string;
  qty: number;
  unit: string;
  /** What one tap on + or - changes, and whether "less" is allowed. */
  step: number;
  canLess: boolean;
}

export function useShopping() {
  const { pantry, list, newId } = usePantryDeps();
  const { logs } = useNutritionDeps();
  const { prefs: prefsRepo, bought: boughtRepo, advisor } = useShoppingDeps();
  const plan = usePlanData();
  const qc = useQueryClient();

  const items = useQuery({ queryKey: PANTRY, queryFn: () => pantry.list() });
  const ids = useQuery({ queryKey: LIST, queryFn: () => list.list() });
  const amounts = useQuery({ queryKey: AMOUNTS, queryFn: () => list.amounts() });
  const prefs = useQuery({ queryKey: PREFS, queryFn: () => prefsRepo.get() });
  const history = useQuery({ queryKey: BOUGHT, queryFn: () => boughtRepo.list() });
  const refresh = () => Promise.all([LIST, PANTRY, AMOUNTS, BOUGHT].map((queryKey) => qc.invalidateQueries({ queryKey })));

  // The app adds what is needed: the next three planned days, minus what the pantry has and what was already eaten today.
  const [today] = useState(() => toDateKey(new Date()));
  const [now] = useState(() => Date.now());
  const todayLogs = useQuery({ queryKey: ["meal-logs", today], queryFn: () => logs.listBetween(today, today) });
  const needed = useMemo(() => {
    if (!plan || !items.data || !todayLogs.data) return null;
    // An empty pantry is unknown, not bare: do not fill the list with every ingredient of the week.
    if (!items.data.length) return [];
    const eatenToday = [...new Set([...plan.dashboard.eatenToday, ...todayLogs.data.map((l) => MEAL_OF_SLOT[l.slot])])];
    return neededForPlan({ plan: plan.plan, recipes: plan.recipes, pantry: items.data, today, eatenToday });
  }, [plan, items.data, todayLogs.data, today]);
  // Once per visit, so something you just ticked off is not put straight back.
  const started = useRef(false);
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!needed || started.current) return;
    started.current = true;
    const add = needed.length ? addNamesToShoppingList({ pantry, list, newId, advisor }, needed) : Promise.resolve(0);
    void add.then(refresh).finally(() => setSynced(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh only wraps qc
  }, [needed, pantry, list, newId, advisor]);

  const bought = useMutation({
    mutationFn: async (id: string) => {
      const prevQty = items.data?.find((i) => i.id === id)?.qty ?? 0;
      const amount = await markBought({ pantry, list }, id);
      // The purchase is done; only the Undo history can be lost if this save fails.
      await boughtRepo.save(withBought(await boughtRepo.list(), { id, prevQty, amount, at: Date.now() })).catch(() => undefined);
    },
    onSuccess: refresh,
  });
  const unbought = useMutation({
    mutationFn: async (id: string) => {
      const rec = (await boughtRepo.list()).find((r) => r.id === id);
      if (!rec) return;
      await unmarkBought({ pantry, list }, id, rec.prevQty, rec.amount);
      await boughtRepo.save(withoutBought(await boughtRepo.list(), id));
    },
    onSuccess: refresh,
  });
  const setAmount = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: Amount }) => list.setAmount(id, amount),
    onMutate: async ({ id, amount }) => {
      await qc.cancelQueries({ queryKey: AMOUNTS });
      const prev = qc.getQueryData<Record<string, Amount>>(AMOUNTS);
      qc.setQueryData<Record<string, Amount>>(AMOUNTS, (a) => ({ ...a, [id]: amount }));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(AMOUNTS, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: AMOUNTS }),
  });
  const save = useMutation({
    mutationFn: (p: ShoppingPrefs) => prefsRepo.save(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: PREFS }),
  });

  const onList = new Set(ids.data ?? []);
  const p = prefs.data ?? null;
  const store = p ? STORES.find((s) => s.id === p.store)! : null;
  const row = (i: { id: string; name: string }, amount: Amount): ShoppingRow => ({
    id: i.id,
    name: i.name,
    storeUrl: p ? storeSearchUrl(p.store, i.name) : null,
    storeName: store?.name ?? null,
    amount,
    amountText: `${formatQty(amount.qty)} ${amount.unit}`,
    qtyText: formatQty(amount.qty),
    qty: amount.qty,
    unit: amount.unit,
    step: stepOf(amount.unit),
    canLess: amount.qty > stepOf(amount.unit),
  });
  const byId = new Map((items.data ?? []).map((i) => [i.id, i]));
  const rows = (items.data ?? []).filter((i) => onList.has(i.id)).map((i) => row(i, amounts.data?.[i.id] ?? DEFAULT_AMOUNT));
  const boughtRows = recentlyBought(history.data ?? [], now)
    .filter((r) => byId.has(r.id) && !onList.has(r.id))
    .map((r) => row(byId.get(r.id)!, r.amount));

  return {
    isLoading: items.isLoading || ids.isLoading || prefs.isLoading || amounts.isLoading || history.isLoading || !synced,
    rows,
    boughtRows,
    /** Nothing in the pantry yet, so the list cannot know what is missing. */
    pantryEmpty: items.data?.length === 0,
    countText: rows.length ? `${rows.length} to buy` : boughtRows.length ? "All bought" : "Nothing to buy",
    prefs: p,
    storeName: store?.name ?? null,
    buy: (id: string) => bought.mutate(id),
    undo: (id: string) => unbought.mutate(id),
    /** Change how much to buy. The unit is not the user's to pick: it comes from the recipe. */
    setQty: (id: string, qty: number) => {
      const unit = amounts.data?.[id]?.unit ?? DEFAULT_AMOUNT.unit;
      setAmount.mutate({ id, amount: clampAmount({ qty, unit }) });
    },
    /** One line typed by hand: it goes on the list (amount from the model when there is one, else 1). */
    addByName: async (name: string) => {
      const n = name.trim();
      if (!n) return;
      await addNamesToShoppingList({ pantry, list, newId, advisor }, [{ name: n }]).catch(() => 0);
      await refresh();
    },
    savePrefs: (zip: string, storeId: StoreId) => save.mutate({ zip: zip.trim(), store: storeId }),
  };
}
