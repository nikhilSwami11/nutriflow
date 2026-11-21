"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { InMemoryPantryRepository, InMemoryShoppingListRepository, LocalUtteranceParser } from "@/data/pantry/inMemory";
import { LocalFeedEventRepository } from "@/data/feed/local";
import { DemoRecipeRepository } from "@/data/recipes/demo";
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
import type { FeedEventRepository } from "@/domain/feed";
import type { RecipeRepository } from "@/domain/recipes";
import { FeedDepsProvider } from "@/view-models/feed/FeedDeps";
import { RecipeDepsProvider } from "@/view-models/recipes/RecipeDeps";
import { DashboardDepsProvider } from "@/view-models/dashboard/DashboardDeps";
import { NutritionDepsProvider, type NutritionDeps } from "@/view-models/nutrition/NutritionDeps";
import { PantryDepsProvider, type PantryDeps } from "@/view-models/pantry/PantryDeps";

interface Deps {
  pantry: PantryDeps;
  nutrition: NutritionDeps;
  /** Demo data for the whole dashboard until real logging feeds it. */
  dashboard: DashboardRepository;
  recipes: RecipeRepository;
  /** Browser storage for now; Supabase copy comes with the real-data phase (migration 0004). */
  feedEvents: FeedEventRepository;
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const newId = () => crypto.randomUUID();
// Reading window.localStorage can itself throw when site data is blocked.
const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => undefined };
  }
};

const inMemory = (): Deps => ({
  pantry: {
    pantry: new InMemoryPantryRepository(SEED),
    list: new InMemoryShoppingListRepository(),
    parser: new LocalUtteranceParser(),
    newId,
  },
  nutrition: { logs: new InMemoryMealLogRepository(seedLogs(new Date())), profile: new InMemoryProfileRepository() },
  dashboard: new DemoDashboardRepository(),
  recipes: new DemoRecipeRepository(),
  feedEvents: new LocalFeedEventRepository(storage()),
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
        recipes: new DemoRecipeRepository(),
        feedEvents: new LocalFeedEventRepository(storage()),
      }),
    );
  }, []);

  if (!deps) return null;
  return (
    <QueryClientProvider client={client}>
      <PantryDepsProvider value={deps.pantry}>
        <NutritionDepsProvider value={deps.nutrition}>
          <DashboardDepsProvider value={deps.dashboard}>
            <RecipeDepsProvider value={deps.recipes}>
              <FeedDepsProvider value={deps.feedEvents}>{children}</FeedDepsProvider>
            </RecipeDepsProvider>
          </DashboardDepsProvider>
        </NutritionDepsProvider>
      </PantryDepsProvider>
    </QueryClientProvider>
  );
}
