"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { InMemoryPantryRepository, InMemoryShoppingListRepository, LocalUtteranceParser } from "@/data/pantry/inMemory";
import { LocalServingHabitRepository } from "@/data/cooking/habits";
import { LocalFeedEventRepository } from "@/data/feed/local";
import { QueuedMealLogRepository } from "@/data/nutrition/queued";
import { DemoMealDetector } from "@/data/photo/demo";
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
import type { MealLogRepository, ProfileRepository } from "@/domain/nutrition";
import type { RecipeRepository } from "@/domain/recipes";
import { CookDepsProvider, type CookDeps } from "@/view-models/cook/CookDeps";
import { FeedDepsProvider } from "@/view-models/feed/FeedDeps";
import { PhotoDepsProvider } from "@/view-models/photo/PhotoDeps";
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
  cook: CookDeps;
  /** Retries meals that could not reach the database. */
  flushLogs: () => Promise<number>;
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

/** Everything that does not depend on which backend is in use. Meal logs always go through the retry queue. */
const assemble = (pantry: PantryDeps, primaryLogs: MealLogRepository, profile: ProfileRepository): Deps => {
  const queue = new QueuedMealLogRepository(primaryLogs, storage());
  return {
    pantry,
    nutrition: { logs: queue, profile },
    dashboard: new DemoDashboardRepository(),
    recipes: new DemoRecipeRepository(),
    feedEvents: new LocalFeedEventRepository(storage()),
    cook: { habits: new LocalServingHabitRepository(storage()), pendingLogs: () => queue.pending() },
    flushLogs: () => queue.flush(),
  };
};

const inMemory = (): Deps =>
  assemble(
    { pantry: new InMemoryPantryRepository(SEED), list: new InMemoryShoppingListRepository(), parser: new LocalUtteranceParser(), newId },
    new InMemoryMealLogRepository(seedLogs(new Date())),
    new InMemoryProfileRepository(),
  );

/** Supabase when env vars are set, otherwise in-memory seeded from the design. */
export function Providers({ children }: { children: React.ReactNode }) {
  // Demo detector until a vision model is connected behind the same port.
  const [detector] = useState(() => new DemoMealDetector());
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  // Built after mount in both modes: time-based data (today, seed dates) must never be frozen at build time.
  const [deps, setDeps] = useState<Deps | null>(null);

  useEffect(() => {
    if (!URL || !KEY) {
      void Promise.resolve().then(() => setDeps(inMemory()));
      return;
    }
    createSupabase(URL, KEY).then((db) =>
      setDeps(
        assemble(
          { pantry: new SupabasePantryRepository(db), list: new SupabaseShoppingListRepository(db), parser: new EdgeUtteranceParser(db), newId },
          new SupabaseMealLogRepository(db),
          new SupabaseProfileRepository(db),
        ),
      ),
    );
  }, []);

  // Meals that could not reach the database wait in a queue: retry now, when back online, and every half minute.
  const flush = deps?.flushLogs;
  useEffect(() => {
    if (!flush) return;
    const run = () => void flush();
    run();
    window.addEventListener("online", run);
    const id = setInterval(run, 30_000);
    return () => {
      window.removeEventListener("online", run);
      clearInterval(id);
    };
  }, [flush]);

  if (!deps) return null;
  return (
    <QueryClientProvider client={client}>
      <PantryDepsProvider value={deps.pantry}>
        <NutritionDepsProvider value={deps.nutrition}>
          <DashboardDepsProvider value={deps.dashboard}>
            <RecipeDepsProvider value={deps.recipes}>
              <FeedDepsProvider value={deps.feedEvents}>
                <CookDepsProvider value={deps.cook}>
                  <PhotoDepsProvider value={detector}>{children}</PhotoDepsProvider>
                </CookDepsProvider>
              </FeedDepsProvider>
            </RecipeDepsProvider>
          </DashboardDepsProvider>
        </NutritionDepsProvider>
      </PantryDepsProvider>
    </QueryClientProvider>
  );
}
