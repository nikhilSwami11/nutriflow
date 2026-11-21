import type { Fix, Ingredient, MealName, Recipe, RecipeRepository, Step, Swap } from "@/domain/recipes";

/** FAKE DATA. Demo recipes so the planner, recipe pages and dashboard have something real-looking to work with. */
const ing = (name: string, qty: number, unit = ""): Ingredient => ({ name, qty, unit });
// Simmering steps are timed; the cook screen shows a countdown for them.
const st = (text: string, verb: string, minutes = verb === "Simmer" ? 10 : undefined): Step => ({ text, verb, ...(minutes ? { minutes } : {}) });

type Seed = Omit<Recipe, "servings" | "blurb"> & { blurb?: string };
const r = (s: Seed): Recipe => ({ servings: 4, blurb: "", ...s });

const RECIPES: Recipe[] = [
  r({ id: "oats-banana", name: "Oats and banana", meal: "Breakfast", minutes: 10, kcal: 340, protein: 12, carbs: 58, fat: 7, tint: "#F4E3A1", blurb: "Warm oats with sliced banana and a spoon of ghee.",
    ingredients: [ing("Rolled oats", 2, "cups"), ing("Bananas", 4), ing("Milk", 3, "cups"), ing("Ghee", 1, "tbsp"), ing("Cinnamon", 1, "tsp")],
    steps: [st("Heat the milk", "Simmer"), st("Stir in the oats and cook", "Stir"), st("Slice the bananas", "Chop"), st("Top with banana, ghee and cinnamon", "Serve")] }),
  r({ id: "omelette", name: "Masala omelette", meal: "Breakfast", minutes: 10, kcal: 310, protein: 22, carbs: 6, fat: 22, tint: "#F7C9BB", blurb: "Fluffy eggs with onion, tomato and green chilli.",
    ingredients: [ing("Eggs", 6), ing("Onions", 1), ing("Tomatoes", 1), ing("Butter", 1, "tbsp"), ing("Green chillies", 2)],
    steps: [st("Chop the onion, tomato and chillies", "Chop"), st("Whisk the eggs with salt", "Mix"), st("Soften the vegetables in butter", "Sauté"), st("Pour in the eggs and fold", "Stir"), st("Serve hot", "Serve")] }),
  r({ id: "poha", name: "Vegetable poha", meal: "Breakfast", minutes: 20, kcal: 380, protein: 9, carbs: 62, fat: 10, tint: "#BFE5D2", blurb: "Flattened rice with peas, onion and curry leaves.",
    ingredients: [ing("Poha", 2, "cups"), ing("Onions", 2), ing("Peas", 1, "cup"), ing("Cumin seeds", 1, "tsp"), ing("Peanuts", 3, "tbsp")],
    steps: [st("Rinse the poha", "Mix"), st("Chop the onions", "Chop"), st("Pop cumin and peanuts", "Sauté"), st("Add onions and peas", "Sauté"), st("Fold in the poha and serve", "Serve")] }),
  r({ id: "dal-rice", name: "Dal rice", meal: "Lunch", minutes: 40, kcal: 610, protein: 24, carbs: 98, fat: 14, tint: "#F4E3A1", blurb: "Plain toor dal over steamed basmati with a ghee drizzle.",
    ingredients: [ing("Toor dal", 1, "cup"), ing("Basmati rice", 2, "cups"), ing("Garlic", 3, "cloves"), ing("Ghee", 2, "tbsp"), ing("Cumin seeds", 1, "tsp")],
    steps: [st("Boil the dal until soft", "Simmer"), st("Steam the rice", "Simmer"), st("Temper cumin and garlic in ghee", "Sauté"), st("Stir the tadka into the dal", "Stir"), st("Serve over rice", "Serve")] }),
  r({ id: "khichdi", name: "Masoor khichdi", meal: "Lunch", minutes: 30, kcal: 420, protein: 18, carbs: 70, fat: 7, tint: "#8FD3C0", blurb: "One-pot red lentils and rice, gentle and filling.",
    ingredients: [ing("Masoor dal", 1, "cup"), ing("Basmati rice", 1, "cup"), ing("Onions", 1), ing("Garlic", 3, "cloves"), ing("Ghee", 1, "tbsp")],
    steps: [st("Rinse the dal and rice", "Mix"), st("Chop the onion", "Chop"), st("Sauté onion and garlic in ghee", "Sauté"), st("Add dal, rice and water", "Stir"), st("Simmer until soft and serve", "Simmer")] }),
  r({ id: "rajma", name: "Rajma chawal", meal: "Lunch", minutes: 50, kcal: 560, protein: 22, carbs: 92, fat: 9, tint: "#9EC8F3", blurb: "Kidney beans in a tomato gravy over rice.",
    ingredients: [ing("Rajma", 1, "cup"), ing("Basmati rice", 2, "cups"), ing("Onions", 2), ing("Tomatoes", 3), ing("Garlic", 4, "cloves"), ing("Ghee", 1, "tbsp")],
    steps: [st("Pressure cook the soaked rajma", "Simmer"), st("Chop the onions and tomatoes", "Chop"), st("Cook the masala in ghee", "Sauté"), st("Add the rajma and simmer", "Simmer"), st("Serve with rice", "Serve")] }),
  r({ id: "paneer-bhurji", name: "Paneer bhurji", meal: "Lunch", minutes: 20, kcal: 390, protein: 24, carbs: 8, fat: 28, tint: "#B9A7EE", blurb: "Crumbled paneer scrambled with onion and tomato.",
    ingredients: [ing("Paneer", 2, "cups"), ing("Onions", 2), ing("Tomatoes", 2), ing("Butter", 1, "tbsp"), ing("Cumin seeds", 1, "tsp")],
    steps: [st("Crumble the paneer", "Mix"), st("Chop the onions and tomatoes", "Chop"), st("Sauté cumin, onion and tomato in butter", "Sauté"), st("Add the paneer and stir", "Stir"), st("Serve", "Serve")] }),
  r({ id: "yogurt-banana", name: "Greek yogurt with banana", meal: "Snack", minutes: 5, kcal: 160, protein: 14, carbs: 22, fat: 2, tint: "#CFC8F0", blurb: "Thick yogurt with sliced banana. A quick protein top-up.",
    ingredients: [ing("Greek yogurt", 2, "cups"), ing("Bananas", 2), ing("Honey", 1, "tsp")],
    steps: [st("Slice the bananas", "Chop"), st("Spoon the yogurt into bowls", "Mix"), st("Top with banana and honey", "Serve")] }),
  r({ id: "chana", name: "Roasted chana", meal: "Snack", minutes: 10, kcal: 180, protein: 9, carbs: 27, fat: 4, tint: "#F4E3A1", blurb: "Crunchy chickpeas tossed with cumin and lemon.",
    ingredients: [ing("Chickpeas", 2, "cups"), ing("Cumin seeds", 1, "tsp"), ing("Lemons", 1)],
    steps: [st("Dry the chickpeas", "Mix"), st("Roast with cumin", "Sauté"), st("Squeeze over the lemon and serve", "Serve")] }),
  r({ id: "dal-tadka", name: "Dal tadka", meal: "Dinner", minutes: 35, kcal: 480, protein: 22, carbs: 62, fat: 15, tint: "#F4E3A1", blurb: "Creamy lentils finished with a sizzling cumin and garlic tadka.",
    ingredients: [ing("Toor dal", 1, "cup"), ing("Onions", 2), ing("Tomatoes", 2), ing("Garlic", 4, "cloves"), ing("Ghee", 2, "tbsp"), ing("Cumin seeds", 1, "tsp"), ing("Fresh coriander", 1, "bunch")],
    steps: [st("Chop the onions and tomatoes", "Chop"), st("Boil the dal until soft", "Simmer"), st("Mash and stir in the tomatoes", "Stir"), st("Sauté cumin and garlic in ghee", "Sauté"), st("Pour the tadka over and stir", "Stir"), st("Simmer together and serve", "Simmer")] }),
  r({ id: "palak-paneer", name: "Palak paneer with rice", meal: "Dinner", minutes: 35, kcal: 620, protein: 26, carbs: 60, fat: 28, tint: "#8FD3C0", blurb: "Spinach gravy with soft paneer, served over rice.",
    ingredients: [ing("Spinach", 4, "bunches"), ing("Paneer", 2, "cups"), ing("Onions", 1), ing("Garlic", 3, "cloves"), ing("Basmati rice", 2, "cups"), ing("Butter", 1, "tbsp")],
    steps: [st("Blanch and blend the spinach", "Simmer"), st("Chop the onion", "Chop"), st("Sauté onion and garlic in butter", "Sauté"), st("Add the spinach and paneer", "Stir"), st("Serve with rice", "Serve")] }),
  r({ id: "pasta", name: "Tomato garlic pasta", meal: "Dinner", minutes: 20, kcal: 540, protein: 16, carbs: 84, fat: 14, tint: "#F2A3A9", blurb: "Quick pasta in a garlicky tomato sauce.",
    ingredients: [ing("Pasta", 2, "boxes"), ing("Tomatoes", 4), ing("Garlic", 4, "cloves"), ing("Butter", 1, "tbsp"), ing("Basil", 1, "bunch")],
    steps: [st("Boil the pasta", "Simmer"), st("Chop the tomatoes", "Chop"), st("Sauté garlic in butter", "Sauté"), st("Cook the tomatoes into a sauce", "Simmer"), st("Toss with the pasta and serve", "Serve")] }),
  r({ id: "moong-chilla", name: "Moong dal chilla", meal: "Breakfast", minutes: 20, kcal: 320, protein: 20, carbs: 42, fat: 8, tint: "#BFE5D2", blurb: "Savoury lentil pancakes with onion and green chilli.",
    ingredients: [ing("Moong dal", 1, "cup"), ing("Onions", 1), ing("Green chillies", 2), ing("Ghee", 1, "tbsp")],
    steps: [st("Soak and blend the dal into a batter", "Mix"), st("Chop the onion and chillies", "Chop"), st("Stir them into the batter", "Stir"), st("Cook thin pancakes in ghee", "Sauté"), st("Serve hot", "Serve")] }),
  r({ id: "egg-toast", name: "Egg bhurji on toast", meal: "Breakfast", minutes: 10, kcal: 420, protein: 26, carbs: 34, fat: 20, tint: "#F7C9BB", blurb: "Spiced scrambled eggs piled on toast.",
    ingredients: [ing("Eggs", 6), ing("Onions", 1), ing("Tomatoes", 1), ing("Bread", 8, "slices"), ing("Butter", 1, "tbsp")],
    steps: [st("Chop the onion and tomato", "Chop"), st("Sauté them in butter", "Sauté"), st("Add the beaten eggs and stir", "Stir"), st("Toast the bread", "Mix"), st("Spoon the eggs over the toast", "Serve")] }),
  r({ id: "chana-masala", name: "Chana masala bowl", meal: "Lunch", minutes: 40, kcal: 640, protein: 28, carbs: 98, fat: 13, tint: "#F4E3A1", blurb: "Chickpeas in a spiced tomato gravy over rice.",
    ingredients: [ing("Chickpeas", 2, "cups"), ing("Basmati rice", 2, "cups"), ing("Onions", 2), ing("Tomatoes", 3), ing("Garlic", 4, "cloves")],
    steps: [st("Chop the onions and tomatoes", "Chop"), st("Cook the masala", "Sauté"), st("Add the chickpeas and simmer", "Simmer"), st("Steam the rice", "Simmer"), st("Serve together", "Serve")] }),
  r({ id: "paneer-wrap", name: "Paneer wrap", meal: "Lunch", minutes: 25, kcal: 560, protein: 30, carbs: 52, fat: 24, tint: "#B9A7EE", blurb: "Spiced paneer, onion and mint chutney in a roti.",
    ingredients: [ing("Paneer", 2, "cups"), ing("Roti", 4), ing("Onions", 1), ing("Mint", 1, "bunch"), ing("Butter", 1, "tbsp")],
    steps: [st("Slice the paneer and onion", "Chop"), st("Sauté the paneer in butter", "Sauté"), st("Warm the rotis", "Mix"), st("Fill and roll", "Stir"), st("Serve", "Serve")] }),
  r({ id: "smoothie", name: "Protein smoothie", meal: "Snack", minutes: 5, kcal: 240, protein: 22, carbs: 28, fat: 4, tint: "#CFC8F0", blurb: "Yogurt, banana and a scoop of protein powder.",
    ingredients: [ing("Greek yogurt", 2, "cups"), ing("Bananas", 2), ing("Protein powder", 2, "scoops"), ing("Milk", 1, "cup")],
    steps: [st("Slice the bananas", "Chop"), st("Blend everything until smooth", "Mix"), st("Pour and serve", "Serve")] }),
  r({ id: "soy-pulao", name: "Soy chunk pulao", meal: "Dinner", minutes: 35, kcal: 640, protein: 36, carbs: 84, fat: 14, tint: "#9EC8F3", blurb: "Fragrant rice with soy chunks and peas.",
    ingredients: [ing("Soy chunks", 1, "cup"), ing("Basmati rice", 2, "cups"), ing("Onions", 2), ing("Peas", 1, "cup"), ing("Ghee", 1, "tbsp")],
    steps: [st("Soak the soy chunks", "Mix"), st("Chop the onions", "Chop"), st("Sauté onions in ghee", "Sauté"), st("Add rice, soy, peas and water", "Stir"), st("Simmer until the rice is done", "Simmer")] }),
  r({ id: "tofu-stir-fry", name: "Tofu stir fry with rice", meal: "Dinner", minutes: 30, kcal: 560, protein: 30, carbs: 70, fat: 16, tint: "#F2A3A9", blurb: "Crisp tofu and vegetables over rice.",
    ingredients: [ing("Tofu", 2, "blocks"), ing("Basmati rice", 2, "cups"), ing("Garlic", 3, "cloves"), ing("Capsicum", 2), ing("Soy sauce", 2, "tbsp")],
    steps: [st("Cube the tofu and slice the capsicum", "Chop"), st("Sear the tofu", "Sauté"), st("Add garlic and capsicum", "Sauté"), st("Splash in the soy sauce", "Stir"), st("Serve over rice", "Serve")] }),
];

/**
 * Hand-written cooking guidance for the recipes people cook most. Step notes are by step number (from 0).
 * A recipe without an entry still gets the per-verb guidance and a checklist built from its ingredients.
 */
interface Guide {
  prep: string[];
  steps?: Record<number, { look?: string; tip?: string; minutes?: number }>;
  fixes?: Fix[];
  swaps?: Swap[];
}

const GUIDES: Record<string, Guide> = {
  "dal-tadka": {
    prep: ["Rinse 1 cup toor dal until the water runs clear", "Chop 2 onions and 2 tomatoes", "Peel and slice 4 garlic cloves", "Measure 2 tbsp ghee and 1 tsp cumin seeds", "Wash a bunch of fresh coriander"],
    steps: {
      0: { look: "Onions in small, even pieces, and the tomatoes a little larger.", tip: "Chop the onions first and the tomatoes last, so your board stays dry longer." },
      1: { minutes: 15, look: "The dal falls apart when you press it between two fingers.", tip: "Skim off any foam in the first few minutes and add a pinch of turmeric." },
      2: { look: "Smooth and thick, like soft porridge.", tip: "Mash against the side of the pot with the back of a ladle." },
      3: { look: "The cumin seeds crackle and the garlic turns light golden.", tip: "Take it off the heat the moment the garlic colours. Dark garlic tastes bitter." },
      4: { look: "The ghee swirls through the dal with a sizzle.", tip: "Pour it in while it is still hot, then cover for 30 seconds to trap the smell." },
      5: { minutes: 5, look: "The flavours have blended and the dal coats the back of a spoon.", tip: "Finish with chopped coriander and a squeeze of lemon." },
    },
    fixes: [{ problem: "bitter", fix: "Garlic that went too dark turns bitter. Make the tadka again with fresh garlic and pour it over." }, { problem: "grainy", fix: "Whisk the dal hard, or blend it for a few seconds, until it is smooth." }],
    swaps: [{ ingredient: "Toor dal", use: "masoor dal", note: "It cooks faster, in about 15 minutes." }],
  },
  "dal-rice": {
    prep: ["Rinse 1 cup toor dal and 2 cups basmati rice, separately", "Peel 3 garlic cloves", "Measure 2 tbsp ghee and 1 tsp cumin seeds"],
    steps: {
      0: { minutes: 15, look: "The dal is soft enough to mash with a spoon.", tip: "A pinch of turmeric and a little oil in the water stops it foaming over." },
      1: { minutes: 12, look: "Each grain is separate and fluffy, with small steam holes on top.", tip: "Do not lift the lid while it steams. The steam is what cooks it." },
    },
    fixes: [{ problem: "mushy", fix: "Next time use a little less water. For now spread the rice on a plate for a few minutes to let it dry." }],
  },
  khichdi: {
    prep: ["Rinse the masoor dal and rice together until the water is clear", "Chop 1 onion", "Peel 3 garlic cloves", "Measure 1 tbsp ghee"],
    steps: {
      3: { look: "The rice and dal are soft enough to mash with a spoon, like thick porridge.", tip: "Start with four cups of water for every cup of rice and dal, and top up with hot water if it gets thick." },
      4: { minutes: 15 },
    },
  },
  omelette: {
    prep: ["Chop 1 onion, 1 tomato and 2 green chillies", "Crack 6 eggs into a bowl", "Measure 1 tbsp butter"],
    steps: {
      1: { look: "The yolks and whites are fully blended and a little frothy.", tip: "Add a pinch of salt now. It breaks the eggs down so the omelette is tender." },
      3: { look: "The edges are set and the middle is still glossy.", tip: "Take it off the heat just before it looks done. It finishes cooking on the plate." },
    },
    fixes: [{ problem: "rubbery", fix: "The heat was too high. Use medium-low next time and take it off while the middle is still glossy." }],
  },
  "palak-paneer": {
    prep: ["Wash 4 bunches of spinach well", "Cube the paneer", "Chop 1 onion and peel 3 garlic cloves", "Measure 2 cups basmati rice and 1 tbsp butter"],
    steps: {
      0: { minutes: 3, look: "The spinach is bright green and only just wilted.", tip: "Move it straight into ice water to keep the colour." },
    },
    fixes: [{ problem: "brown", fix: "Spinach turns olive when it cooks too long. Blanch it for less time and cool it fast." }, { problem: "gritty", fix: "The spinach needs a second wash. Strain the gravy through a sieve if it is already blended." }],
  },
  "oats-banana": {
    prep: ["Measure 2 cups oats and 3 cups milk", "Peel and slice the bananas"],
    steps: { 1: { look: "Creamy and thick, with the oats soft but not mushy.", tip: "Stir often so the bottom does not catch." } },
  },
};

const guided = (r: Recipe): Recipe => {
  const g = GUIDES[r.id];
  if (!g) return r;
  return {
    ...r,
    prep: g.prep,
    fixes: g.fixes,
    swaps: g.swaps,
    steps: r.steps.map((st, i) => {
      const n = g.steps?.[i];
      return n ? { ...st, ...(n.look ? { look: n.look } : {}), ...(n.tip ? { tip: n.tip } : {}), ...(n.minutes ? { minutes: n.minutes } : {}) } : st;
    }),
  };
};
const ALL: Recipe[] = RECIPES.map(guided);

export const RECIPE_IDS = ALL.map((x) => x.id);
export const MEAL_ORDER: MealName[] = ["Breakfast", "Lunch", "Snack", "Dinner"];

export class DemoRecipeRepository implements RecipeRepository {
  async list() {
    return ALL;
  }
}
