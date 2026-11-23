import type { Fix, Swap } from "../recipes/types";

/** What to look for and one tip, per cooking verb. Recipes override these for steps that need more. */
export const VERB_GUIDE: Record<string, { look: string; tip: string }> = {
  Chop: { look: "Pieces about the same size, so they cook evenly.", tip: "Curl your fingertips back and keep the knife tip on the board." },
  Stir: { look: "Everything looks evenly mixed, with no dry pockets or streaks.", tip: "Scrape the bottom as you go so nothing catches." },
  Mix: { look: "No dry patches left.", tip: "Mix only until combined. Over-mixing makes batters tough." },
  Simmer: { look: "Small bubbles break the surface gently. It is not a hard boil.", tip: "Turn the heat down once it bubbles and partly cover it so it does not dry out." },
  "Sauté": { look: "A steady sizzle, with the food turning golden at the edges.", tip: "Let the pan get hot first, and stir often so spices do not burn." },
  Bake: { look: "Golden on top, and a skewer pushed into the middle comes out clean.", tip: "Preheat the oven first, and keep the door shut so the heat stays in." },
  Toast: { look: "An even golden colour on both sides.", tip: "Watch it closely at the end. Toast goes from golden to burnt quickly." },
  Blend: { look: "Smooth, with no chunks left, and it pours easily.", tip: "Start on low, then go faster. Add a splash of liquid if it will not turn." },
  Chill: { look: "Cold all the way through and set a little thicker.", tip: "Cover it so it does not pick up fridge smells. Overnight is best." },
  Whisk: { look: "Pale and frothy, with the whites and yolks fully mixed.", tip: "Whisk with your wrist in quick small circles. Keep the bowl steady on a damp cloth." },
  Fry: { look: "Edges turn golden and set, and the oil sizzles around the food.", tip: "Wait until the oil shimmers before adding food. Do not crowd the pan." },
  Boil: { look: "A steady rolling boil, with large bubbles breaking the surface.", tip: "Salt the water once it boils, and turn it down if it foams over." },
  Mash: { look: "Mostly smooth, with only a few small lumps if you like it rustic.", tip: "Press straight down, then turn the bowl a little and press again." },
  Grate: { look: "Thin, even shreds that pile up loosely.", tip: "Press gently and keep your fingers away from the last bit. Stop when the piece gets small." },
  Knead: { look: "A smooth, soft dough that springs back when poked.", tip: "Push with the heel of your hand, fold, turn and repeat. Add flour a pinch at a time if it sticks." },
  Roll: { look: "An even thickness all the way across, and a round shape.", tip: "Dust the board lightly and turn the dough a quarter after every few rolls." },
  Serve: { look: "Hot all the way through and tasting balanced.", tip: "Taste once more. A pinch of salt or a squeeze of lemon can lift it." },
  Top: { look: "An even scatter over the whole dish, not a pile in the middle.", tip: "Sprinkle from a little higher up so it spreads out." },
  Assemble: { look: "Fillings sit in the middle with a clear edge, so it closes without spilling.", tip: "Put wet things like salsa on top of dry ones so the base stays crisp." },
  Toss: { look: "Every piece is lightly coated, with no dressing pooled at the bottom.", tip: "Lift from the bottom and let it fall. Add dressing a little at a time." },
  Slice: { look: "Even slices that hold their shape.", tip: "Use long, gentle strokes and let the knife do the work. Do not press down." },
  Sear: { look: "A deep brown crust that lets go of the pan on its own.", tip: "Pat it dry first and do not move it until it releases." },
  Roast: { look: "Golden brown edges and tender when poked with a knife.", tip: "Spread it out in one layer with space between pieces, or it steams instead." },
};

export const FALLBACK_GUIDE = { look: "It looks and smells the way you expect.", tip: "Taste as you go. You can always add more, never take it out." };

/** What to do when it goes wrong. Matched on the words in the question. */
export const GENERIC_FIXES: Fix[] = [
  { problem: "salty", fix: "Add a splash of water and a little more of the main ingredient. A squeeze of lemon also helps." },
  { problem: "bland", fix: "Add salt a pinch at a time, then a squeeze of lemon or a pinch of spice. Taste between each." },
  { problem: "burnt", fix: "Lift out what is not burnt into a clean pan right away and do not scrape the bottom. A little lemon or sugar can balance a faint smoky taste." },
  { problem: "spicy", fix: "Stir in a spoon of yogurt, cream or ghee, or add more of the main ingredient to dilute it." },
  { problem: "sour", fix: "Add a pinch of sugar, or more of the base to balance it." },
  { problem: "thick", fix: "Stir in a splash of hot water at a time until it loosens." },
  { problem: "watery", fix: "Simmer it uncovered for a few minutes so it reduces, or mash a few spoons of the main ingredient into it." },
  { problem: "dry", fix: "Add a splash of water or ghee and cover for a minute so it steams." },
  { problem: "oily", fix: "Spoon the oil off the top, or stir in a little hot water." },
  { problem: "sweet", fix: "Add a squeeze of lemon or a pinch of salt to cut it." },
  { problem: "lumpy", fix: "Whisk or mash hard for a minute. For a batter, push it through a sieve." },
  { problem: "sticking", fix: "Lower the heat, add a splash of water or oil, and loosen the bottom with a spatula." },
];

/** Common stand-ins. Matched on the ingredient name (plural-folded). */
export const GENERIC_SWAPS: Swap[] = [
  { ingredient: "butter", use: "ghee or a neutral oil", note: "Same amount." },
  { ingredient: "ghee", use: "butter or a neutral oil", note: "Same amount." },
  { ingredient: "milk", use: "water or any plant milk", note: "Same amount. It will be a little less creamy." },
  { ingredient: "paneer", use: "firm tofu", note: "Same weight." },
  { ingredient: "tomato", use: "canned chopped tomatoes", note: "About 1 cup for every 2 tomatoes." },
  { ingredient: "onion", use: "shallots, or the white part of spring onions" },
  { ingredient: "garlic", use: "ginger-garlic paste or garlic powder", note: "A quarter teaspoon of powder per clove." },
  { ingredient: "cumin", use: "ground cumin", note: "Half the amount, added later so it does not burn." },
  { ingredient: "coriander", use: "mint or parsley, or leave it out" },
  { ingredient: "toor dal", use: "moong or masoor dal", note: "Masoor cooks faster, about 15 minutes." },
  { ingredient: "rice", use: "any long-grain rice" },
  { ingredient: "spinach", use: "fenugreek leaves or kale" },
  { ingredient: "lemon", use: "vinegar", note: "Half the amount." },
  { ingredient: "egg", use: "a thick chickpea-flour batter", note: "Roughly 3 tablespoons of flour mixed with water for each egg." },
];
