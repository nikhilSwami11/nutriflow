"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { InMemoryPantryRepository, InMemoryShoppingListRepository, LocalUtteranceParser } from "@/data/pantry/inMemory";
import { LocalBoughtRepository } from "@/data/shopping/boughtLocal";
import { LocalShoppingPrefsRepository } from "@/data/shopping/local";
import { SupabaseBoughtRepository, SupabaseShoppingPrefsRepository } from "@/data/shopping/supabase";
import type { BoughtRepository, ShoppingPrefsRepository } from "@/domain/shopping";
import { InMemoryChoreRepository, SEED_CHORES } from "@/data/chores/inMemory";
import { SupabaseChoreRepository } from "@/data/chores/supabase";
import { InMemoryAuthRepository } from "@/data/auth/inMemory";
import { SupabaseAuthRepository } from "@/data/auth/supabase";
import { LocalLeftoverRepository } from "@/data/cooking/leftovers";
import { LocalServingHabitRepository, SupabaseServingHabitRepository } from "@/data/cooking/habits";
import { LocalPrepDoneRepository, SupabasePrepDoneRepository } from "@/data/planning/prep";
import type { ServingHabitRepository } from "@/domain/cooking";
import { LocalFeedEventRepository } from "@/data/feed/local";
import { MirroredFeedEventRepository } from "@/data/feed/mirrored";
import { SupabaseFeedEventRepository } from "@/data/feed/supabase";
import { QueuedMealLogRepository } from "@/data/nutrition/queued";
import { DemoMealDetector } from "@/data/photo/demo";
import { EdgeMealDetector, EdgePantryScanner, FallbackMealDetector } from "@/data/photo/edge";
import { DemoRecipeRepository } from "@/data/recipes/demo";
import { DemoDashboardRepository } from "@/data/dashboard/demo";
import { LogDashboardRepository } from "@/data/dashboard/logs";
import { InMemoryMealPlanRepository } from "@/data/planning/inMemory";
import { SupabaseMealPlanRepository } from "@/data/planning/supabase";
import type { MealPlanRepository, PrepDoneRepository } from "@/domain/planning";
import { InMemoryMealLogRepository, InMemoryProfileRepository } from "@/data/nutrition/inMemory";
import { seedLogs } from "@/data/nutrition/seed";
import { SupabaseMealLogRepository, SupabaseProfileRepository } from "@/data/nutrition/supabase";
import { SEED } from "@/data/pantry/seed";
import {
  createSupabase,
  EdgeBuyAdvisor,
  EdgeRecipeSearch,
  EdgeUtteranceParser,
  SupabasePantryRepository,
  SupabaseShoppingListRepository,
} from "@/data/pantry/supabase";
import type { DashboardRepository } from "@/domain/dashboard";
import type { FeedEventRepository } from "@/domain/feed";
import type { MealLogRepository, ProfileRepository } from "@/domain/nutrition";
import type { RecipeRepository } from "@/domain/recipes";
import type { AuthRepository } from "@/domain/auth";
import type { RecipeAdapter, RecipeSearch, RecipeWriter } from "@/domain/eat";
import type { MyRecipeRepository } from "@/domain/recipes";
import { CombinedRecipeRepository, InMemoryMyRecipeRepository, SupabaseMyRecipeRepository } from "@/data/recipes/mine";
import { EdgeRecipeWriter } from "@/data/eat/edgeWriter";
import { EdgeRecipeAdapter } from "@/data/recipes/edgeAdapter";
import type { BuyAdvisor } from "@/domain/pantry";
import { EatDepsProvider, type EatDeps } from "@/view-models/eat/EatDeps";
import { AuthDepsProvider } from "@/view-models/auth/AuthDeps";
import { ShoppingDepsProvider, type ShoppingDeps } from "@/view-models/shopping/ShoppingDeps";
import { ChoreDepsProvider } from "@/view-models/chores/ChoreDeps";
import type { ChoreRepository } from "@/domain/chores";
import { CookDepsProvider, type CookDeps } from "@/view-models/cook/CookDeps";
import { FeedDepsProvider } from "@/view-models/feed/FeedDeps";
import { PhotoDepsProvider, type PhotoDeps } from "@/view-models/photo/PhotoDeps";
import { RecipeDepsProvider } from "@/view-models/recipes/RecipeDeps";
import { DashboardDepsProvider } from "@/view-models/dashboard/DashboardDeps";
import { NutritionDepsProvider, type NutritionDeps } from "@/view-models/nutrition/NutritionDeps";
import { PantryDepsProvider, type PantryDeps } from "@/view-models/pantry/PantryDeps";
import { ChatDepsProvider, type ChatDeps } from "@/view-models/home/ChatDeps";
import { EdgeChatBrain } from "@/data/assistant/edgeChat";
import type { ChatBrain } from "@/domain/assistant";
import { watchTables } from "@/data/live/watch";
import { chatTools } from "./chatTools";

interface Deps {
  auth: AuthRepository;
  chores: ChoreRepository;
  shopping: ShoppingDeps;
  eat: EatDeps;
  pantry: PantryDeps;
  nutrition: NutritionDeps;
  /** Built from meal logs with Supabase; demo data offline. */
  dashboard: DashboardRepository;
  recipes: RecipeRepository;
  /** Browser storage, mirrored to Supabase when it is set. */
  feedEvents: FeedEventRepository;
  cook: CookDeps;
  /** The Home chat: the assistant's tools over these same repositories, and the model when Supabase is set. */
  chat: ChatDeps;
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
const assemble = (
  /** True for a real account (Supabase) or a fresh offline one: the dashboard comes from its own logs, never the demo. */
  live: boolean,
  auth: AuthRepository,
  chores: ChoreRepository,
  pantry: PantryDeps,
  primaryLogs: MealLogRepository,
  profile: ProfileRepository,
  plans: MealPlanRepository,
  remoteFeed?: FeedEventRepository,
  advisor?: BuyAdvisor,
  recipeSearch?: RecipeSearch,
  mine: MyRecipeRepository = new InMemoryMyRecipeRepository(),
  writer?: RecipeWriter,
  // In the account with Supabase; in the browser offline.
  habits: ServingHabitRepository = new LocalServingHabitRepository(storage()),
  prep: PrepDoneRepository = new LocalPrepDoneRepository(storage()),
  shoppingPrefs: ShoppingPrefsRepository = new LocalShoppingPrefsRepository(storage()),
  bought: BoughtRepository = new LocalBoughtRepository(storage()),
  adapter?: RecipeAdapter,
  brain?: ChatBrain,
): Deps => {
  const builtins = new DemoRecipeRepository();
  const queue = new QueuedMealLogRepository(primaryLogs, storage());
  const recipes = new CombinedRecipeRepository(builtins, mine);
  const tools = chatTools({ logs: queue, profile, pantry: pantry.pantry, list: pantry.list, chores, recipes, mine, plans, prep, habits, writer, newId });
  return {
    auth,
    chores,
    eat: { writer, adapter, mine, builtins, search: recipeSearch, newId },
    shopping: { prefs: shoppingPrefs, bought, advisor },
    pantry,
    nutrition: { logs: queue, profile, plans, prep },
    // Only the offline demo shows sample history; a real account sees its own logs, empty at first.
    dashboard: live ? new LogDashboardRepository(queue, profile) : new DemoDashboardRepository(),
    recipes,
    chat: { brain, tools },
    feedEvents: remoteFeed ? new MirroredFeedEventRepository(new LocalFeedEventRepository(storage()), remoteFeed) : new LocalFeedEventRepository(storage()),
    cook: { habits, leftovers: new LocalLeftoverRepository(storage()), pendingLogs: () => queue.pending() },
    flushLogs: () => queue.flush(),
  };
};

// Offline mode starts as a brand-new account (no pantry, chores, logs or history) when this key is set: e2e uses it.
const FRESH_KEY = "nutriflow.fresh";

const inMemory = (): Deps => {
  const fresh = storage().getItem(FRESH_KEY) === "1";
  const profile = new InMemoryProfileRepository();
  const logs = new InMemoryMealLogRepository(fresh ? [] : seedLogs(new Date()));
  // A fresh offline session behaves like a new real account: dashboard from its (empty) logs.
  return assemble(
    fresh,
    new InMemoryAuthRepository(),
    new InMemoryChoreRepository(fresh ? [] : SEED_CHORES),
    { pantry: new InMemoryPantryRepository(fresh ? [] : SEED), list: new InMemoryShoppingListRepository(), parser: new LocalUtteranceParser(), newId },
    logs,
    profile,
    new InMemoryMealPlanRepository(),
  );
};

/** Supabase when env vars are set, otherwise in-memory seeded from the design. */
export function Providers({ children }: { children: React.ReactNode }) {
  // The example until a signed-in account can reach the vision model (edge function scan-photo).
  const [photo, setPhoto] = useState<PhotoDeps>(() => ({ detector: new DemoMealDetector() }));
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }));
  // Built after mount in both modes: time-based data (today, seed dates) must never be frozen at build time.
  const [deps, setDeps] = useState<Deps | null>(null);

  useEffect(() => {
    if (!URL || !KEY) {
      void Promise.resolve().then(() => setDeps(inMemory()));
      return;
    }
    let stop: (() => void) | undefined;
    let cancelled = false;
    void createSupabase(URL, KEY).then((db) => {
      // Changes made in chat or on another device refetch what is on screen. Not "what-to-eat": writing a meal saves a row, which would
      // fire this again and write another meal, forever (the Food screen kept changing under you).
      if (!cancelled) stop = watchTables(db, () => void client.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "what-to-eat" }));
      setPhoto({ detector: new FallbackMealDetector(new EdgeMealDetector(db), new DemoMealDetector()), scanner: new EdgePantryScanner(db) });
      setDeps(
        assemble(
          true,
          new SupabaseAuthRepository(db, window.location.origin),
          new SupabaseChoreRepository(db),
          { pantry: new SupabasePantryRepository(db), list: new SupabaseShoppingListRepository(db), parser: new EdgeUtteranceParser(db), newId },
          new SupabaseMealLogRepository(db),
          new SupabaseProfileRepository(db),
          new SupabaseMealPlanRepository(db),
          new SupabaseFeedEventRepository(db),
          new EdgeBuyAdvisor(db),
          new EdgeRecipeSearch(db),
          new SupabaseMyRecipeRepository(db),
          new EdgeRecipeWriter(db),
          new SupabaseServingHabitRepository(db),
          new SupabasePrepDoneRepository(db),
          new SupabaseShoppingPrefsRepository(db),
          new SupabaseBoughtRepository(db),
          new EdgeRecipeAdapter(db),
          new EdgeChatBrain(db),
        ),
      );
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [client]);

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
      <AuthDepsProvider value={deps.auth}>
      <ChoreDepsProvider value={{ repo: deps.chores, newId }}>
      <ShoppingDepsProvider value={deps.shopping}>
      <EatDepsProvider value={deps.eat}>
      <PantryDepsProvider value={deps.pantry}>
        <NutritionDepsProvider value={deps.nutrition}>
          <DashboardDepsProvider value={deps.dashboard}>
            <RecipeDepsProvider value={deps.recipes}>
              <FeedDepsProvider value={deps.feedEvents}>
                <CookDepsProvider value={deps.cook}>
                  <ChatDepsProvider value={deps.chat}>
                    <PhotoDepsProvider value={photo}>{children}</PhotoDepsProvider>
                  </ChatDepsProvider>
                </CookDepsProvider>
              </FeedDepsProvider>
            </RecipeDepsProvider>
          </DashboardDepsProvider>
        </NutritionDepsProvider>
      </PantryDepsProvider>
      </EatDepsProvider>
      </ShoppingDepsProvider>
      </ChoreDepsProvider>
      </AuthDepsProvider>
    </QueryClientProvider>
  );
}
