import type { Fix, Ingredient, IngredientForm, Recipe, Step, Swap } from "@/domain/recipes";

// Household Indian recipes, written the way they are cooked at home: the masala is its own spices (haldi, lal mirch, dhania,
// jeera, garam masala), salt goes in at named moments, the tadka has an order, and the last step tastes and balances.
// They replace the thin placeholders by id (see `COMPLETE` in demo.ts). Nutrition, picture and tint stay as they were.

const i = (name: string, qty: number, unit = "", group?: string, form?: IngredientForm): Ingredient => ({ name, qty, unit, ...(group ? { group } : {}), ...(form ? { form } : {}) });
type Note = { m?: number; look?: string; tip?: string; g?: string };
const s = (text: string, verb: string, n: Note = {}): Step => ({ text, verb, ...(n.m ? { minutes: n.m } : {}), ...(n.look ? { look: n.look } : {}), ...(n.tip ? { tip: n.tip } : {}), ...(n.g ? { group: n.g } : {}) });

/** What can go wrong in almost any curry, and the fix. */
const FIXES: Fix[] = [
  { problem: "salty", fix: "Add a little hot water, or a spoon of cream or yogurt, and a pinch of sugar. A cut potato simmered for 10 minutes also helps." },
  { problem: "bland", fix: "It usually needs salt first, then a squeeze of lemon. If it still tastes flat, fry a pinch of garam masala in a teaspoon of ghee and stir it in." },
  { problem: "sour", fix: "Add a pinch of sugar and a spoon of cream or ghee, and let it simmer 3 minutes." },
  { problem: "spicy", fix: "Stir in a spoon of cream, yogurt or ghee, and a pinch of sugar. Serve with plain rice or roti." },
  { problem: "raw", fix: "The masala was not cooked long enough. Cook it on medium until the oil separates at the edges, then taste again." },
  { problem: "watery", fix: "Simmer without the lid on a medium flame, stirring, until it thickens. Mash a few pieces against the side to help." },
  { problem: "thick", fix: "Add hot water, a little at a time, and simmer one minute. Cold water dulls the taste." },
  { problem: "bitter", fix: "Garlic or spice that went too dark turns bitter. Make the tadka again with fresh garlic and pour it over, then balance with a pinch of sugar and a squeeze of lemon." },
  { problem: "grainy", fix: "Whisk the dal hard, or blend it for a few seconds, until it is smooth." },
  { problem: "burnt", fix: "Do not scrape the bottom. Move the top to a clean pot, add hot water, and fix the salt and sourness at the end." },
];
const BASE: Swap[] = [
  { ingredient: "Red chilli powder", use: "paprika with a pinch of cayenne", note: "Paprika gives colour; the cayenne gives heat. Start with half." },
  { ingredient: "Coriander powder", use: "ground cumin with a pinch of garam masala", note: "Use the same amount." },
  { ingredient: "Bay leaf", use: "leave it out" },
];

interface Spec { minutes: number; servings?: number; ingredients: Ingredient[]; steps: Step[]; swaps?: Swap[]; fixes?: Fix[] }
const make = (x: Spec): Partial<Recipe> => ({ minutes: x.minutes, servings: x.servings ?? 4, ingredients: x.ingredients, steps: x.steps, prep: undefined, swaps: [...(x.swaps ?? []), ...BASE], fixes: [...(x.fixes ?? []), ...FIXES] });

export const COMPLETE: Record<string, Partial<Recipe>> = {
  "dal-tadka": make({ minutes: 40, ingredients: [
    i("Toor dal", 1, "cup", "Dal"), i("Turmeric", 0.5, "tsp", "Dal"), i("Salt", 1.5, "tsp", "Dal"), i("Water", 3, "cups", "Dal"),
    i("Ghee", 2, "tbsp", "Tadka"), i("Cumin seeds", 1, "tsp", "Tadka"), i("Hing", 1, "pinch", "Tadka"), i("Dried red chillies", 2, "pcs", "Tadka"), i("Garlic", 5, "cloves", "Tadka"),
    i("Onions", 1, "pcs", "Tadka"), i("Ginger", 1, "tbsp", "Tadka"), i("Green chillies", 2, "pcs", "Tadka"), i("Tomatoes", 2, "pcs", "Tadka"),
    i("Red chilli powder", 0.5, "tsp", "Tadka"), i("Coriander powder", 1, "tsp", "Tadka"), i("Garam masala", 0.5, "tsp", "Finish"), i("Lemon", 0.5, "pcs", "Finish"), i("Fresh coriander", 1, "bunch", "Finish"),
  ], steps: [
    s("Boil the dal with the water, turmeric and half the salt until it is completely soft", "Boil", { m: 20, g: "Dal", look: "The dal falls apart when pressed between two fingers.", tip: "Skim the foam in the first few minutes. A pressure cooker takes 3 whistles." }),
    s("Mash the dal smooth with the back of a ladle and loosen it with hot water to a pourable thickness", "Mash", { g: "Dal", look: "Smooth and creamy, not grainy.", tip: "Keep it a little thinner than you want: it thickens as it stands." }),
    s("Chop the onion and tomatoes finely, mince the garlic and ginger, and slit the green chillies", "Chop", { g: "Tadka" }),
    s("Heat the ghee until it shimmers. Crackle the cumin, then add the hing, dried chillies and garlic until the garlic is light golden", "Sauté", { g: "Tadka", look: "The cumin crackles in seconds and the garlic turns pale gold.", tip: "Take the pan off the heat the moment garlic colours. Dark garlic tastes bitter." }),
    s("Add the onion with a pinch of salt and cook until golden, then the ginger and green chillies for a minute", "Sauté", { g: "Tadka", look: "The onion is golden at the edges, not brown.", tip: "A pinch of salt draws the water out and speeds up browning." }),
    s("Add the tomatoes, red chilli powder, coriander powder and the rest of the salt. Cook, splashing in water if it sticks, until the oil separates", "Sauté", { g: "Tadka", look: "A thick paste with oil shining at the edges.", tip: "Ground spices burn in seconds: add them with the tomato, never into dry hot oil." }),
    s("Pour the masala into the dal and stir well", "Stir", { g: "Tadka" }),
    s("Simmer the dal and masala together", "Simmer", { m: 5, g: "Tadka", look: "The dal coats the back of a spoon.", tip: "Add hot water if it thickens, never cold." }),
    s("Stir in the garam masala, lemon juice and coriander. Taste and adjust the salt, sourness and heat", "Stir", { g: "Finish", look: "Rounded: salty, a little sour, warm at the back of the throat.", tip: "Fix salt first, then lemon, then chilli. Add one pinch at a time." }),
  ], swaps: [{ ingredient: "Toor dal", use: "masoor dal", note: "It cooks faster, in about 15 minutes." }, { ingredient: "Hing", use: "an extra clove of garlic", note: "Hing helps digest dal and adds a savoury depth. Skipping it is fine." }] }),

  "dal-rice": make({ minutes: 40, ingredients: [
    i("Toor dal", 1, "cup", "Dal"), i("Turmeric", 0.5, "tsp", "Dal"), i("Salt", 1.5, "tsp", "Dal"), i("Water", 3, "cups", "Dal"),
    i("Ghee", 2, "tbsp", "Tadka"), i("Cumin seeds", 1, "tsp", "Tadka"), i("Garlic", 4, "cloves", "Tadka"), i("Dried red chillies", 2, "pcs", "Tadka"), i("Red chilli powder", 0.5, "tsp", "Tadka"), i("Tomatoes", 1, "pcs", "Tadka"),
    i("Basmati rice", 2, "cups", "Rice"), i("Water", 4, "cups", "Rice"), i("Salt", 1, "tsp", "Rice"), i("Lemon", 0.5, "pcs", "Finish"), i("Fresh coriander", 1, "bunch", "Finish"),
  ], steps: [
    s("Boil the dal with the water, turmeric and half the salt until very soft", "Boil", { m: 20, g: "Dal", look: "Soft enough to mash with a spoon.", tip: "A drop of oil in the water stops it foaming over." }),
    s("Boil the rice with 4 cups water and the salt, covered, until the water is gone", "Boil", { m: 12, g: "Rice", look: "Each grain is separate, with small steam holes on top.", tip: "Do not lift the lid. The steam does the cooking." }),
    s("Mash the dal smooth and loosen it with hot water", "Mash", { g: "Dal" }),
    s("Chop the tomato and slice the garlic", "Chop", { g: "Tadka" }),
    s("Heat the ghee, crackle the cumin, then add the garlic and dried chillies until golden. Add the tomato and red chilli powder and cook until soft", "Sauté", { g: "Tadka", look: "The garlic is gold and the tomato has broken down.", tip: "Pour the tadka while it still sizzles: that sizzle is the flavour." }),
    s("Pour the tadka over the dal and stir. Taste and adjust the salt, then add a squeeze of lemon and the coriander", "Stir", { g: "Finish", tip: "Dal needs more salt than you think. Add it a pinch at a time." }),
    s("Serve the dal over the rice", "Serve", { g: "Finish" }),
  ] }),

  khichdi: make({ minutes: 35, ingredients: [
    i("Masoor dal", 1, "cup"), i("Rice", 1, "cup"), i("Water", 5, "cups"), i("Turmeric", 0.5, "tsp"), i("Salt", 1.5, "tsp"),
    i("Ghee", 2, "tbsp"), i("Cumin seeds", 1, "tsp"), i("Hing", 1, "pinch"), i("Onions", 1, "pcs"), i("Tomatoes", 1, "pcs"), i("Ginger", 1, "tbsp"), i("Green chillies", 2, "pcs"), i("Garlic", 3, "cloves"),
    i("Fresh coriander", 1, "bunch"),
  ], steps: [
    s("Chop the onion and tomato, mince the ginger and garlic, and slit the green chillies", "Chop"),
    s("Heat the ghee, crackle the cumin and hing, then add the onion with a pinch of salt and cook until soft and golden", "Sauté", { look: "Soft, golden onions and a nutty smell.", tip: "Do not brown it: khichdi is a gentle dish." }),
    s("Add the garlic, ginger, green chillies and tomato and cook until the tomato melts", "Sauté", { look: "A soft, jammy base.", tip: "Mash the tomato with the spoon as it cooks." }),
    s("Add the rinsed dal and rice, turmeric, the rest of the salt and the water. Boil, then cover and cook on low until the rice and dal are mushy", "Boil", { m: 20, look: "The rice and dal are soft enough to mash, like thick porridge.", tip: "Top up with hot water if it gets too thick. Khichdi should flow slowly." }),
    s("Taste and adjust the salt, add a spoon of ghee on top and the coriander", "Stir", { look: "Soft, salty enough, glossy with ghee.", tip: "Serve with curd, pickle and papad." }),
  ] }),

  rajma: make({ minutes: 60, ingredients: [
    i("Rajma", 1, "cup", "Rajma", "dry"), i("Water", 4, "cups", "Rajma"), i("Salt", 1, "tsp", "Rajma"), i("Bay leaf", 1, "pcs", "Masala"),
    i("Oil", 3, "tbsp", "Masala"), i("Cumin seeds", 1, "tsp", "Masala"), i("Onions", 2, "pcs", "Masala"), i("Ginger-garlic paste", 1.5, "tbsp", "Masala"), i("Tomatoes", 3, "pcs", "Masala"),
    i("Turmeric", 0.5, "tsp", "Masala"), i("Red chilli powder", 1, "tsp", "Masala"), i("Coriander powder", 1.5, "tsp", "Masala"), i("Salt", 1, "tsp", "Masala"), i("Garam masala", 1, "tsp", "Finish"), i("Kasuri methi", 1, "tsp", "Finish"), i("Fresh coriander", 1, "bunch", "Finish"),
    i("Basmati rice", 2, "cups", "Rice"), i("Water", 4, "cups", "Rice"), i("Salt", 1, "tsp", "Rice"),
  ], steps: [
    s("Soak the rajma overnight, then pressure cook with the water and salt until completely soft", "Boil", { m: 35, g: "Rajma", look: "A bean mashes easily between two fingers.", tip: "Do not add tomato or lemon to the beans yet: acid keeps them hard." }),
    s("Boil the rice with 4 cups water and the salt, covered, until the water is gone", "Boil", { m: 12, g: "Rice" }),
    s("Chop the onions and tomatoes finely", "Chop", { g: "Masala" }),
    s("Heat the oil, add the bay leaf and cumin, then the onions with a pinch of salt. Cook until deep golden", "Sauté", { g: "Masala", look: "Deep golden, almost caramel at the edges.", tip: "This takes 10 minutes. Patience here is the flavour of rajma." }),
    s("Add the ginger-garlic paste and cook until the raw smell goes, then the tomatoes. Cook until the oil separates", "Sauté", { g: "Masala", look: "A thick paste with oil on the sides.", tip: "Sprinkle a spoon of water if it sticks." }),
    s("Add the turmeric, red chilli powder, coriander powder and salt and cook for a minute, splashing in water so they do not burn", "Sauté", { g: "Masala", tip: "Ground spices cook in under a minute. Burnt spice is bitter." }),
    s("Add the cooked rajma with its water and simmer, mashing a few beans against the pot to thicken", "Simmer", { m: 20, g: "Masala", look: "A thick gravy that coats the beans.", tip: "Mashing a handful of beans is how rajma gets creamy without cream." }),
    s("Stir in the garam masala, crushed kasuri methi and coriander. Taste and adjust the salt, heat and sourness", "Stir", { g: "Finish", look: "Rounded: salty, warm, a little tangy from the tomato.", tip: "A squeeze of lemon lifts a flat rajma." }),
    s("Serve the rajma over the rice", "Serve", { g: "Finish" }),
  ] }),

  "chana-masala": make({ minutes: 50, ingredients: [
    i("Chickpeas", 2, "cups", "Chana", "soaked"), i("Water", 3, "cups", "Chana"), i("Salt", 1, "tsp", "Chana"), i("Turmeric", 0.5, "tsp", "Chana"),
    i("Oil", 3, "tbsp", "Masala"), i("Cumin seeds", 1, "tsp", "Masala"), i("Bay leaf", 1, "pcs", "Masala"), i("Onions", 2, "pcs", "Masala"), i("Ginger-garlic paste", 1, "tbsp", "Masala"), i("Green chillies", 2, "pcs", "Masala"), i("Tomatoes", 3, "pcs", "Masala"),
    i("Red chilli powder", 1, "tsp", "Masala"), i("Coriander powder", 2, "tsp", "Masala"), i("Chana masala", 2, "tsp", "Masala"), i("Salt", 1, "tsp", "Masala"), i("Amchur", 1, "tsp", "Finish"), i("Lemon", 0.5, "pcs", "Finish"), i("Fresh coriander", 1, "bunch", "Finish"),
    i("Basmati rice", 2, "cups", "Rice"), i("Water", 4, "cups", "Rice"), i("Salt", 1, "tsp", "Rice"),
  ], steps: [
    s("Boil the soaked chickpeas with the water, turmeric and salt until soft", "Boil", { m: 25, g: "Chana", look: "A chickpea crushes easily between two fingers.", tip: "Keep the cooking water: it makes the gravy." }),
    s("Boil the rice with 4 cups water and the salt, covered, until the water is gone", "Boil", { m: 12, g: "Rice" }),
    s("Chop the onions and tomatoes and slit the green chillies", "Chop", { g: "Masala" }),
    s("Heat the oil, crackle the cumin with the bay leaf, then cook the onions with a pinch of salt until golden", "Sauté", { g: "Masala", look: "Golden brown onions.", tip: "Brown onions give chana its dark colour." }),
    s("Add the ginger-garlic paste and green chillies for a minute, then the tomatoes and cook until the oil separates", "Sauté", { g: "Masala" }),
    s("Add the red chilli powder, coriander powder, chana masala and salt with a splash of water and cook for a minute", "Sauté", { g: "Masala", tip: "Splash water the second the spices smell toasted." }),
    s("Add the chickpeas with a cup of their water and simmer, mashing a few to thicken the gravy", "Simmer", { m: 15, g: "Masala", look: "A thick, dark gravy clinging to the chickpeas.", tip: "Simmer uncovered for the last 5 minutes." }),
    s("Stir in the amchur, lemon juice and coriander. Taste and adjust the salt, sourness and heat", "Stir", { g: "Finish", look: "Tangy, salty and warm in balance.", tip: "Chana should be tangy: add amchur or lemon until it wakes up." }),
    s("Serve the chana over the rice", "Serve", { g: "Finish" }),
  ], swaps: [{ ingredient: "Chana masala", use: "garam masala with coriander powder", note: "1 tsp garam masala and 1 tsp coriander powder replace 2 tsp." }, { ingredient: "Amchur", use: "lemon juice", note: "1 tbsp lemon juice for 1 tsp amchur, added at the end." }] }),

  "aloo-gobi": make({ minutes: 40, ingredients: [
    i("Potatoes", 3, "pcs"), i("Cauliflower", 1, "pcs"), i("Oil", 3, "tbsp"), i("Cumin seeds", 1, "tsp"), i("Onions", 1, "pcs"), i("Ginger", 1, "tbsp"), i("Green chillies", 2, "pcs"), i("Tomatoes", 2, "pcs"),
    i("Turmeric", 0.5, "tsp"), i("Red chilli powder", 1, "tsp"), i("Coriander powder", 1, "tsp"), i("Salt", 1.5, "tsp"), i("Garam masala", 0.5, "tsp"), i("Amchur", 0.5, "tsp"), i("Fresh coriander", 1, "bunch"),
  ], steps: [
    s("Cut the potatoes into 2 cm cubes and the cauliflower into medium florets. Chop the onion and tomatoes, mince the ginger and slit the chillies", "Chop"),
    s("Heat the oil, crackle the cumin, then cook the onion with a pinch of salt until golden", "Sauté", { look: "Golden at the edges.", tip: "Medium heat. Browning too fast makes it bitter." }),
    s("Add the ginger and chillies, then the tomatoes with the turmeric, red chilli powder and coriander powder. Cook until the oil separates", "Sauté", { look: "A thick masala with oil on the sides.", tip: "A splash of water stops the spices sticking." }),
    s("Add the potatoes, cauliflower and salt and coat well. Cover and cook on low, stirring now and then, until both are tender", "Simmer", { m: 15, look: "A fork goes through the potato easily.", tip: "No water needed: the vegetables steam in their own moisture. Add 2 tbsp only if it sticks." }),
    s("Uncover and cook 2 more minutes to dry it. Stir in the garam masala, amchur and coriander. Taste and adjust the salt and sourness", "Stir", { look: "Dry, coated and fragrant.", tip: "Aloo gobi is a dry sabzi: it should cling, not swim." }),
  ] }),

  "palak-paneer": make({ minutes: 45, ingredients: [
    i("Spinach", 4, "bunches", "Palak"), i("Green chillies", 2, "pcs", "Palak"), i("Water", 1, "cup", "Palak"),
    i("Paneer", 2, "cups", "Masala"), i("Ghee", 2, "tbsp", "Masala"), i("Cumin seeds", 1, "tsp", "Masala"), i("Onions", 2, "pcs", "Masala"), i("Garlic", 4, "cloves", "Masala"), i("Ginger", 1, "tbsp", "Masala"), i("Tomatoes", 2, "pcs", "Masala"),
    i("Turmeric", 0.25, "tsp", "Masala"), i("Red chilli powder", 0.5, "tsp", "Masala"), i("Coriander powder", 1, "tsp", "Masala"), i("Salt", 1.5, "tsp", "Masala"), i("Garam masala", 0.5, "tsp", "Finish"), i("Kasuri methi", 1, "tsp", "Finish"), i("Cream", 2, "tbsp", "Finish"),
    i("Basmati rice", 2, "cups", "Rice"), i("Water", 4, "cups", "Rice"), i("Salt", 1, "tsp", "Rice"),
  ], steps: [
    s("Boil the spinach with the green chillies for 2 minutes, then move it straight into cold water", "Boil", { m: 2, g: "Palak", look: "Bright green and just wilted.", tip: "The cold water keeps the colour. Skip it and the palak turns olive." }),
    s("Blend the spinach to a smooth puree with a little of the water", "Blend", { g: "Palak" }),
    s("Boil the rice with 4 cups water and the salt, covered, until the water is gone", "Boil", { m: 12, g: "Rice" }),
    s("Chop the onions and tomatoes, mince the garlic and ginger, and cube the paneer", "Chop", { g: "Masala" }),
    s("Heat the ghee, crackle the cumin, then cook the onions with a pinch of salt until golden. Add the garlic and ginger for a minute", "Sauté", { g: "Masala", look: "Golden onions and a sweet garlicky smell.", tip: "Do not let the garlic brown." }),
    s("Add the tomatoes, turmeric, red chilli powder, coriander powder and salt. Cook until the oil separates", "Sauté", { g: "Masala" }),
    s("Stir in the spinach puree and simmer, then add the paneer", "Simmer", { m: 8, g: "Masala", look: "A thick green gravy, glossy.", tip: "Do not boil hard or the green turns dull. Add the paneer last so it stays soft." }),
    s("Stir in the garam masala, crushed kasuri methi and cream. Taste and adjust the salt, sourness and heat", "Stir", { g: "Finish", look: "Creamy, mild, with a little warmth.", tip: "A squeeze of lemon brightens the greens." }),
    s("Serve the palak paneer with the rice", "Serve", { g: "Finish" }),
  ], swaps: [{ ingredient: "Paneer", use: "firm tofu", note: "Pan-fry the cubes first so they hold their shape." }] }),

  "paneer-bhurji": make({ minutes: 20, ingredients: [
    i("Paneer", 2, "cups"), i("Oil", 2, "tbsp"), i("Cumin seeds", 1, "tsp"), i("Onions", 2, "pcs"), i("Ginger", 1, "tbsp"), i("Green chillies", 2, "pcs"), i("Tomatoes", 2, "pcs"),
    i("Turmeric", 0.5, "tsp"), i("Red chilli powder", 0.5, "tsp"), i("Coriander powder", 1, "tsp"), i("Salt", 1, "tsp"), i("Garam masala", 0.5, "tsp"), i("Kasuri methi", 0.5, "tsp"), i("Lemon", 0.5, "pcs"), i("Fresh coriander", 1, "bunch"),
  ], steps: [
    s("Chop the onions and tomatoes, mince the ginger and chillies, and crumble the paneer", "Chop"),
    s("Heat the oil, crackle the cumin, then cook the onions with a pinch of salt until soft and golden", "Sauté", { look: "Soft, light golden onions.", tip: "High heat makes bhurji dry. Keep it medium." }),
    s("Add the ginger and chillies, then the tomatoes with the turmeric, red chilli powder and coriander powder. Cook until the tomatoes melt", "Sauté", { look: "A thick masala, tomatoes fully broken down." }),
    s("Add the paneer and the salt and mix gently for 3 minutes", "Mix", { look: "Paneer is hot through and coated.", tip: "Do not overcook: paneer turns rubbery." }),
    s("Stir in the garam masala, crushed kasuri methi, lemon juice and coriander. Taste and adjust the salt, sourness and heat", "Stir", { look: "Moist, fragrant, bright.", tip: "Serve with roti or toast." }),
  ] }),

  "baingan-bharta": make({ minutes: 45, ingredients: [
    i("Eggplant", 2, "pcs"), i("Oil", 3, "tbsp"), i("Cumin seeds", 1, "tsp"), i("Onions", 2, "pcs"), i("Garlic", 5, "cloves"), i("Ginger", 1, "tbsp"), i("Green chillies", 2, "pcs"), i("Tomatoes", 2, "pcs"),
    i("Turmeric", 0.5, "tsp"), i("Red chilli powder", 0.5, "tsp"), i("Coriander powder", 1, "tsp"), i("Salt", 1.25, "tsp"), i("Garam masala", 0.5, "tsp"), i("Lemon", 0.5, "pcs"), i("Fresh coriander", 1, "bunch"),
  ], steps: [
    s("Rub the eggplants with a little oil and roast them directly on the flame or in a hot oven until the skin is charred and the flesh collapses", "Roast", { m: 20, look: "Blackened skin and a soft, collapsed body.", tip: "The char is the smoky flavour of bharta: do not skip it." }),
    s("Peel the eggplants and mash the flesh roughly", "Mash", { look: "Soft and stringy, not a puree." }),
    s("Chop the onions and tomatoes, mince the garlic and ginger, and slit the chillies", "Chop"),
    s("Heat the oil, crackle the cumin, then cook the onions with a pinch of salt until golden. Add the garlic, ginger and chillies for a minute", "Sauté", { look: "Golden onions and a toasted garlic smell." }),
    s("Add the tomatoes, turmeric, red chilli powder, coriander powder and salt. Cook until the oil separates", "Sauté", { look: "A thick masala with oil on the sides." }),
    s("Add the mashed eggplant and cook for 8 minutes, stirring, until the flavours join", "Sauté", { m: 8, look: "Everything is one soft, glossy mixture.", tip: "A spoon of oil on top at the end makes it taste restaurant-rich." }),
    s("Stir in the garam masala, lemon juice and coriander. Taste and adjust the salt, sourness and heat", "Stir", { tip: "Serve with hot rotis." }),
  ] }),

  "bhindi-masala": make({ minutes: 30, ingredients: [
    i("Okra", 500, "g"), i("Oil", 3, "tbsp"), i("Cumin seeds", 1, "tsp"), i("Onions", 2, "pcs"), i("Tomatoes", 1, "pcs"), i("Green chillies", 2, "pcs"),
    i("Turmeric", 0.5, "tsp"), i("Red chilli powder", 0.5, "tsp"), i("Coriander powder", 1.5, "tsp"), i("Salt", 1, "tsp"), i("Amchur", 1, "tsp"), i("Garam masala", 0.25, "tsp"),
  ], steps: [
    s("Wash the okra and dry it completely with a cloth, then cut into 2 cm pieces", "Chop", { look: "Bone dry before it goes near the pan.", tip: "Wet okra turns slimy. Dry it for 15 minutes in the air if you can." }),
    s("Chop the onions and tomato and slit the chillies", "Chop"),
    s("Fry the okra in 2 tbsp of the oil on medium until it is no longer sticky and has light brown spots, then set it aside", "Fry", { m: 10, look: "No more slime, light brown spots.", tip: "Do not cover the pan: steam makes it sticky." }),
    s("Heat the remaining oil, crackle the cumin, then cook the onions with a pinch of salt until golden. Add the chillies and tomato until soft", "Sauté", { look: "Golden onions, soft tomato." }),
    s("Add the turmeric, red chilli powder and coriander powder and cook for a minute, splashing in water so they do not burn", "Sauté" ),
    s("Return the okra, add the salt and mix gently. Cook uncovered for 5 minutes", "Stir", { m: 5, look: "Coated and dry, not soggy.", tip: "Salt late. Early salt draws water and makes okra slimy." }),
    s("Stir in the amchur and garam masala. Taste and adjust the salt and sourness", "Stir", { tip: "Bhindi should be tangy and dry." }),
  ] }),

  "egg-curry": make({ minutes: 40, ingredients: [
    i("Eggs", 6, "pcs", "Eggs"), i("Salt", 0.5, "tsp", "Eggs"), i("Oil", 3, "tbsp", "Masala"), i("Cumin seeds", 1, "tsp", "Masala"), i("Bay leaf", 1, "pcs", "Masala"), i("Onions", 3, "pcs", "Masala"), i("Ginger-garlic paste", 1, "tbsp", "Masala"), i("Green chillies", 2, "pcs", "Masala"), i("Tomatoes", 3, "pcs", "Masala"),
    i("Turmeric", 0.5, "tsp", "Masala"), i("Red chilli powder", 1, "tsp", "Masala"), i("Coriander powder", 1.5, "tsp", "Masala"), i("Salt", 1.25, "tsp", "Masala"), i("Water", 1.5, "cups", "Masala"), i("Garam masala", 0.5, "tsp", "Finish"), i("Kasuri methi", 1, "tsp", "Finish"), i("Fresh coriander", 1, "bunch", "Finish"),
  ], steps: [
    s("Boil the eggs in water with the salt for 10 minutes, cool in cold water, peel, and make a small slit in each", "Boil", { m: 10, g: "Eggs", look: "A firm, pale yolk.", tip: "The slit lets the masala in." }),
    s("Chop the onions and tomatoes", "Chop", { g: "Masala" }),
    s("Heat the oil, add the cumin and bay leaf, then cook the onions with a pinch of salt until deep golden", "Sauté", { g: "Masala", look: "Deep golden brown.", tip: "The onion colour sets the colour of the curry." }),
    s("Add the ginger-garlic paste and chillies for a minute, then the tomatoes. Cook until the oil separates", "Sauté", { g: "Masala" }),
    s("Add the turmeric, red chilli powder, coriander powder and the salt and cook a minute, then add the water", "Sauté", { g: "Masala", tip: "Splash water the second the spices smell toasted." }),
    s("Add the eggs and simmer until the gravy thickens", "Simmer", { m: 10, g: "Masala", look: "A gravy that coats the eggs.", tip: "Spoon the gravy over the eggs now and then." }),
    s("Stir in the garam masala, crushed kasuri methi and coriander. Taste and adjust the salt, heat and sourness", "Stir", { g: "Finish", tip: "A squeeze of lemon lifts it." }),
  ] }),

  "chicken-curry": make({ minutes: 55, ingredients: [
    i("Chicken", 600, "g", "Chicken"), i("Yogurt", 0.25, "cup", "Chicken"), i("Turmeric", 0.5, "tsp", "Chicken"), i("Salt", 2, "tsp", "Chicken"),
    i("Oil", 3, "tbsp", "Masala"), i("Cumin seeds", 1, "tsp", "Masala"), i("Bay leaf", 1, "pcs", "Masala"), i("Cardamom pods", 2, "pcs", "Masala"), i("Cloves", 3, "pcs", "Masala"), i("Cinnamon stick", 1, "pcs", "Masala"),
    i("Onions", 3, "pcs", "Masala"), i("Ginger-garlic paste", 1.5, "tbsp", "Masala"), i("Green chillies", 2, "pcs", "Masala"), i("Tomatoes", 3, "pcs", "Masala"),
    i("Red chilli powder", 1, "tsp", "Masala"), i("Coriander powder", 2, "tsp", "Masala"), i("Water", 1.5, "cups", "Masala"), i("Garam masala", 1, "tsp", "Finish"), i("Fresh coriander", 1, "bunch", "Finish"), i("Lemon", 0.5, "pcs", "Finish"),
  ], steps: [
    s("Mix the chicken with the yogurt, turmeric and half the salt and rest it while you prepare the rest", "Mix", { g: "Chicken", tip: "Even 15 minutes helps; an hour is better." }),
    s("Chop the onions and tomatoes finely", "Chop", { g: "Masala" }),
    s("Heat the oil and crackle the cumin with the bay leaf, cardamom, cloves and cinnamon. Add the onions with a pinch of salt and cook until deep golden", "Sauté", { g: "Masala", look: "Deep golden brown and sweet-smelling.", tip: "Whole spices go into hot oil first: they release their oils." }),
    s("Add the ginger-garlic paste and chillies for 2 minutes, then the tomatoes. Cook until the oil separates", "Sauté", { g: "Masala", look: "A thick paste with oil at the edges." }),
    s("Add the red chilli powder and coriander powder and cook a minute, splashing in water so they do not burn", "Sauté", { g: "Masala" }),
    s("Add the chicken with its marinade and cook on high for 5 minutes, stirring, until it turns white", "Sauté", { m: 5, g: "Chicken", look: "No pink on the outside.", tip: "High heat seals the chicken and keeps it juicy." }),
    s("Add the water and the rest of the salt, cover and simmer until the chicken is cooked through", "Simmer", { m: 25, g: "Masala", look: "The chicken is tender and the gravy has thickened.", tip: "Uncover for the last 5 minutes if the gravy is thin." }),
    s("Stir in the garam masala, coriander and lemon juice. Taste and adjust the salt, sourness and heat", "Stir", { g: "Finish", look: "Rounded and rich, with a little heat.", tip: "Serve with rice or roti." }),
  ] }),

  "paneer-butter-masala": make({ minutes: 40, ingredients: [
    i("Tomatoes", 5, "pcs", "Gravy"), i("Onions", 1, "pcs", "Gravy"), i("Cashews", 2, "tbsp", "Gravy"), i("Ginger-garlic paste", 1, "tbsp", "Gravy"), i("Butter", 1, "tbsp", "Gravy"), i("Cardamom pods", 2, "pcs", "Gravy"), i("Water", 1, "cup", "Gravy"),
    i("Butter", 2, "tbsp", "Finish"), i("Kashmiri red chilli powder", 1, "tsp", "Finish"), i("Coriander powder", 1, "tsp", "Finish"), i("Turmeric", 0.25, "tsp", "Finish"), i("Salt", 1.5, "tsp", "Finish"), i("Sugar", 1, "tsp", "Finish"),
    i("Paneer", 2, "cups", "Finish"), i("Cream", 0.5, "cup", "Finish"), i("Garam masala", 0.5, "tsp", "Finish"), i("Kasuri methi", 1, "tsp", "Finish"),
  ], steps: [
    s("Chop the tomatoes and onion roughly and cube the paneer", "Chop", { g: "Gravy" }),
    s("Melt the butter, add the cardamom, then cook the onion, ginger-garlic paste, cashews and tomatoes with the water until completely soft", "Sauté", { m: 15, g: "Gravy", look: "Mushy tomatoes and a sweet smell.", tip: "Cover the pan so the tomatoes steam soft." }),
    s("Cool slightly and blend into a very smooth puree, then strain if you want it silky", "Blend", { g: "Gravy", look: "Smooth and bright orange-red." }),
    s("Heat the butter, add the red chilli powder, coriander powder and turmeric for 10 seconds, then pour in the puree and the salt", "Sauté", { g: "Finish", look: "The puree bubbles and darkens.", tip: "Kashmiri chilli gives colour without too much heat." }),
    s("Simmer the gravy, then add the sugar and the paneer", "Simmer", { m: 10, g: "Finish", look: "A thick gravy that coats a spoon, with butter at the edges.", tip: "Add the paneer last so it stays soft." }),
    s("Stir in the cream, garam masala and crushed kasuri methi. Taste and adjust the salt, sugar and sourness", "Stir", { g: "Finish", look: "Creamy, mildly sweet, tangy underneath.", tip: "Balance matters most here: if it tastes flat add salt; sharp, add sugar; heavy, add lemon." }),
  ], swaps: [{ ingredient: "Cashews", use: "2 tbsp cream or melon seeds", note: "They thicken the gravy and make it creamy." }] }),

  "chicken-tikka-masala": make({ minutes: 75, ingredients: [
    i("Chicken", 600, "g", "Marinade"), i("Yogurt", 0.5, "cup", "Marinade"), i("Ginger-garlic paste", 1, "tbsp", "Marinade"), i("Lemon", 1, "pcs", "Marinade"), i("Kashmiri red chilli powder", 1, "tsp", "Marinade"), i("Turmeric", 0.5, "tsp", "Marinade"),
    i("Coriander powder", 1, "tsp", "Marinade"), i("Garam masala", 1, "tsp", "Marinade"), i("Oil", 1, "tbsp", "Marinade"), i("Salt", 1.5, "tsp", "Marinade"),
    i("Butter", 2, "tbsp", "Masala"), i("Oil", 1, "tbsp", "Masala"), i("Cumin seeds", 1, "tsp", "Masala"), i("Onions", 2, "pcs", "Masala"), i("Ginger-garlic paste", 1, "tbsp", "Masala"), i("Tomatoes", 4, "pcs", "Masala"), i("Cashews", 2, "tbsp", "Masala"),
    i("Red chilli powder", 1, "tsp", "Masala"), i("Coriander powder", 1, "tsp", "Masala"), i("Salt", 1.25, "tsp", "Masala"), i("Sugar", 0.5, "tsp", "Masala"), i("Cream", 0.5, "cup", "Finish"), i("Garam masala", 1, "tsp", "Finish"), i("Kasuri methi", 1, "tsp", "Finish"), i("Fresh coriander", 1, "bunch", "Finish"),
  ], steps: [
    s("Mix the chicken with the yogurt, ginger-garlic paste, lemon juice, spices, oil and salt. Rest it for at least 30 minutes", "Mix", { g: "Marinade", look: "Every piece coated in a deep red paste.", tip: "Do not marinate with lemon for more than 4 hours: it makes chicken mealy." }),
    s("Chop the onions and tomatoes", "Chop", { g: "Masala" }),
    s("Roast the chicken pieces on a hot tray or grill until charred in spots and just cooked", "Roast", { m: 15, g: "Marinade", look: "Charred edges and juices that run clear.", tip: "The char is the 'tikka' flavour. Do not cook it fully: it finishes in the gravy." }),
    s("Heat the butter and oil, crackle the cumin, then cook the onions with a pinch of salt until golden. Add the ginger-garlic paste for a minute", "Sauté", { g: "Masala", look: "Golden onions, a sweet garlicky smell.", tip: "Whole spices go into hot fat first, then aromatics, then ground spices." }),
    s("Add the tomatoes and cashews and cook until completely soft, then the red chilli powder, coriander powder and salt. Cook until the oil separates", "Sauté", { g: "Masala", look: "A thick red paste with oil at the edges." }),
    s("Blend the masala smooth, return it to the pan and simmer with the sugar", "Simmer", { m: 8, g: "Masala", look: "A silky, glossy red gravy.", tip: "Add a splash of water if it spits and sticks." }),
    s("Add the roasted chicken and the cream and simmer gently", "Simmer", { m: 8, g: "Finish", look: "The gravy clings to the chicken.", tip: "Keep it at a gentle bubble so the cream does not split." }),
    s("Stir in the garam masala, crushed kasuri methi and coriander. Taste and adjust the salt, sourness, heat and sweetness", "Stir", { g: "Finish", look: "Creamy and smoky, with a tang and a slow heat.", tip: "Too sharp: a pinch of sugar. Too heavy: lemon. Flat: salt." }),
  ], swaps: [{ ingredient: "Kashmiri red chilli powder", use: "paprika with a pinch of cayenne", note: "It gives the colour; use cayenne sparingly for heat." }, { ingredient: "Cream", use: "full-fat yogurt or cashew paste", note: "Stir it in off the heat so it does not split." }] }),

  omelette: make({ minutes: 12, servings: 2, ingredients: [
    i("Eggs", 6, "pcs"), i("Onions", 1, "pcs"), i("Tomatoes", 1, "pcs"), i("Green chillies", 2, "pcs"), i("Fresh coriander", 1, "bunch"),
    i("Turmeric", 0.25, "tsp"), i("Red chilli powder", 0.25, "tsp"), i("Salt", 0.75, "tsp"), i("Black pepper", 0.25, "tsp"), i("Butter", 1, "tbsp"),
  ], steps: [
    s("Chop the onion, tomato, chillies and coriander finely", "Chop", { look: "Small, even pieces so they cook as the egg sets." }),
    s("Whisk the eggs with the salt, turmeric, red chilli powder and pepper until frothy, then fold in the chopped vegetables", "Whisk", { look: "Yolks and whites fully blended and a little frothy.", tip: "Salt the eggs now: it breaks them down and keeps the omelette tender." }),
    s("Heat the butter on medium and pour in the egg. Cook until the edges set", "Fry", { m: 3, look: "The edges are set and the middle is still glossy.", tip: "Medium heat. High heat makes it rubbery." }),
    s("Fold the omelette over and cook another minute. Taste a corner and add a pinch of salt at the table if needed", "Serve", { tip: "It finishes cooking on the plate: take it off while the middle is still soft." }),
  ] }),

  poha: make({ minutes: 20, servings: 2, ingredients: [
    i("Poha", 2, "cups"), i("Oil", 2, "tbsp"), i("Mustard seeds", 1, "tsp"), i("Peanuts", 3, "tbsp"), i("Curry leaves", 10, "pcs"), i("Green chillies", 2, "pcs"), i("Onions", 1, "pcs"), i("Potatoes", 1, "pcs"),
    i("Turmeric", 0.5, "tsp"), i("Salt", 1, "tsp"), i("Sugar", 1, "tsp"), i("Lemon", 1, "pcs"), i("Fresh coriander", 1, "bunch"),
  ], steps: [
    s("Rinse the poha in a sieve until it is soft but not mushy, drain, and toss with half the salt, the sugar and the turmeric", "Mix", { look: "Soft enough to press between two fingers, still holding its shape.", tip: "Do not soak it: rinsing is enough, or it turns to paste." }),
    s("Dice the potato small and chop the onion and chillies", "Chop"),
    s("Heat the oil, fry the peanuts until golden, then crackle the mustard seeds. Add the curry leaves and chillies", "Sauté", { look: "The mustard pops and the curry leaves crisp.", tip: "Mustard seeds must pop or they taste bitter." }),
    s("Add the potato with a splash of water and cook covered until soft, then the onion until translucent", "Sauté", { m: 8, look: "A fork goes through the potato; the onion is glassy." }),
    s("Add the poha and the rest of the salt and toss gently on low heat for 2 minutes", "Toss", { m: 2, look: "Hot, fluffy and yellow.", tip: "Fold, do not stir hard: poha breaks." }),
    s("Squeeze the lemon over and add the coriander. Taste and adjust the salt, sourness and sweetness", "Serve", { tip: "The sour-sweet balance is what makes poha." }),
  ] }),

  upma: make({ minutes: 20, servings: 2, ingredients: [
    i("Rava", 1, "cup"), i("Ghee", 2, "tbsp"), i("Mustard seeds", 1, "tsp"), i("Urad dal", 1, "tsp"), i("Cashews", 1, "tbsp"), i("Curry leaves", 10, "pcs"), i("Green chillies", 2, "pcs"), i("Ginger", 1, "tbsp"),
    i("Onions", 1, "pcs"), i("Carrots", 1, "pcs"), i("Peas", 0.25, "cup"), i("Water", 2.5, "cups"), i("Salt", 1.25, "tsp"), i("Lemon", 0.5, "pcs"), i("Fresh coriander", 1, "bunch"),
  ], steps: [
    s("Dry roast the rava on low heat until it smells nutty and stays loose, then set it aside", "Toast", { m: 4, look: "A light nutty smell, no colour change.", tip: "Roasting is what keeps upma from turning sticky." }),
    s("Chop the onion, carrot and chillies and grate the ginger", "Chop"),
    s("Heat the ghee, crackle the mustard seeds and urad dal, then add the cashews, curry leaves, chillies and ginger", "Sauté", { look: "The urad dal turns golden and the mustard pops." }),
    s("Add the onion, carrot and peas with a pinch of salt and cook until soft", "Sauté", { m: 4, look: "The onion is soft and glassy." }),
    s("Pour in the water with the rest of the salt and bring it to a rolling boil", "Boil", { m: 3, look: "A steady boil before the rava goes in.", tip: "Taste the water: it should taste slightly too salty. The rava soaks up the salt." }),
    s("Lower the heat and rain in the rava slowly while stirring. Cover and cook until the water is absorbed", "Stir", { m: 3, look: "Soft grains, no lumps, no water left.", tip: "Add the rava in a thin stream while stirring to avoid lumps." }),
    s("Finish with the lemon juice and coriander. Taste and adjust the salt and sourness", "Serve", { tip: "A spoon of ghee on top is the home-style finish." }),
  ] }),
};
