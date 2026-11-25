/**
 * Dishes that have a picture but no built-in recipe. When an assistant writes a recipe with one of these names, it takes the
 * picture (see `matchPicture`). Add a line here when a new picture lands in public/recipes.
 */
export const DISH_PICTURES: { name: string; image: string }[] = [
  ["hummus-plate", "Hummus and pita"], ["falafel-wrap", "Falafel wrap"], ["chicken-shawarma-bowl", "Chicken shawarma bowl"], ["chicken-stir-fry", "Chicken stir fry"],
  ["beef-broccoli", "Beef and broccoli"], ["kung-pao-chicken", "Kung pao chicken"], ["sweet-sour-chicken", "Sweet and sour chicken"], ["veg-fried-rice", "Vegetable fried rice"],
  ["chow-mein", "Chow mein"], ["buddha-bowl", "Buddha bowl"], ["banh-mi", "Banh mi"], ["dumplings", "Dumplings"], ["kimchi-fried-rice", "Kimchi fried rice"],
  ["tteokbokki", "Tteokbokki"], ["pad-thai", "Pad thai"], ["thai-green-curry", "Thai green curry"], ["thai-basil-chicken", "Thai basil chicken"],
  ["veg-curry-coconut", "Coconut vegetable curry"], ["pho", "Pho"], ["lentil-soup", "Lentil soup"], ["black-bean-soup", "Black bean soup"],
  ["broccoli-cheddar-soup", "Broccoli cheddar soup"], ["tofu-scramble", "Tofu scramble"], ["ramen-egg", "Ramen with egg"], ["chicken-teriyaki", "Chicken teriyaki"],
  ["salmon-rice-bowl", "Salmon rice bowl"], ["katsu-curry", "Katsu curry"], ["miso-soup", "Miso soup"], ["bibimbap", "Bibimbap"],
  ["korean-fried-chicken", "Korean fried chicken"], ["mapo-tofu", "Mapo tofu"],
  ["chickpea-salad-sandwich", "Chickpea salad sandwich"], ["sweet-potato-bowl", "Sweet potato bowl"], ["tuna-salad", "Tuna salad"], ["egg-salad-sandwich", "Egg salad sandwich"],
  ["cottage-cheese-pancakes", "Cottage cheese pancakes"], ["peanut-noodles", "Peanut noodles"], ["ramen-veg", "Veg ramen"], ["buffalo-wings", "Buffalo wings"],
  ["bbq-ribs", "BBQ ribs"], ["hot-dog", "Hot dog"], ["chicken-fajitas", "Chicken fajitas"], ["waffles", "Waffles"], ["bagel-cream-cheese", "Bagel with cream cheese"],
  ["oatmeal-bowl", "Oatmeal bowl"], ["hash-browns", "Hash browns and egg"], ["biscuits-and-gravy", "Biscuits and gravy"], ["chicken-pot-pie", "Chicken pot pie"],
  ["chicken-broccoli-casserole", "Chicken broccoli casserole"],
  ["brownies", "Brownies"], ["chocolate-chip-cookies", "Chocolate chip cookies"], ["cheesecake", "Cheesecake"], ["apple-pie", "Apple pie"], ["ice-cream-sundae", "Ice cream sundae"],
  ["donuts", "Donuts"], ["coleslaw", "Coleslaw"], ["jambalaya", "Jambalaya"], ["gumbo", "Gumbo"], ["clam-chowder", "Clam chowder"], ["lobster-roll", "Lobster roll"],
  ["orange-chicken", "Orange chicken"], ["general-tsos-chicken", "General Tso's chicken"], ["lo-mein", "Lo mein"],
].map(([slug, name]) => ({ name, image: `/recipes/${slug}.webp` }));
