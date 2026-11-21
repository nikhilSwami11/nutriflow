"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { InMemoryPantryRepository, InMemoryShoppingListRepository, LocalUtteranceParser } from "@/data/pantry/inMemory";
import { DemoDashboardRepository } from "@/data/dashboard/demo";
import { InMemoryMealLogRepository, InMemoryProfileRepository } from "@/data/nutrition/inMemory";
import { seedLogs } from "@/data/nutrition/seed";
import { SupabaseMealLogRepository, SupabaseProfileRepository } from "@/data/nutrition/supabase";
import { SEED } from "@/data/pantry/seed";
import {
  createSupabase,
  EdgeUtteranceParser,
  SupabasePantryRepository,
  SupabaseShoppingListRepository,
} from "@/data/pantry/supabase";
import type { DashboardRepository } from "@/domain/dashboard";
import { DashboardDepsProvider } from "@/view-models/dashboard/DashboardDeps";
import { NutritionDepsProvider, type NutritionDeps } from "@/view-models/nutrition/NutritionDeps";
import { PantryDepsProvider, type PantryDeps } from "@/view-models/pantry/PantryDeps";

interface Deps {
  pantry: PantryDeps;
  nutrition: NutritionDeps;
  /** Demo data for the whole dashboard until real logging feeds it. */
  dashboard: DashboardRepository;
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const newId = () => crypto.randomUUID();

const inMemory = (): Deps => ({
  pantry: {
    pantry: new InMemoryPantryRepository(SEED),
    list: new InMemoryShoppingListRepository(),
    parser: new LocalUtteranceParser(),
    newId,
  },
  nutrition: { logs: new InMemoryMealLogRepository(seedLogs(new Date())), profile: new InMemoryProfileRepository() },
  dashboard: new DemoDashboardRepository(),
});

/** Supabase when env vars are set, otherwise in-memory seeded from the design. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  // Built after mount in both modes: time-based data (today, seed dates) must never be frozen at build time.
  const [deps, setDeps] = useState<Deps | null>(null);

  useEffect(() => {
    if (!URL || !KEY) {
      void Promise.resolve().then(() => setDeps(inMemory()));
      return;
    }
    createSupabase(URL, KEY).then((db) =>
      setDeps({
        pantry: {
          pantry: new SupabasePantryRepository(db),
          list: new SupabaseShoppingListRepository(db),
          parser: new EdgeUtteranceParser(db),
          newId,
        },
        nutrition: { logs: new SupabaseMealLogRepository(db), profile: new SupabaseProfileRepository(db) },
        dashboard: new DemoDashboardRepository(),
      }),
    );
  }, []);

  if (!deps) return null;
  return (
    <QueryClientProvider client={client}>
      <PantryDepsProvider value={deps.pantry}>
        <NutritionDepsProvider value={deps.nutrition}>
          <DashboardDepsProvider value={deps.dashboard}>{children}</DashboardDepsProvider>
        </NutritionDepsProvider>
      </PantryDepsProvider>
    </QueryClientProvider>
  );
}
