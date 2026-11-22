# Recipe image list and prompts

158 recipes: 120 images done, 38 needed (see the `image` column). The next batch, ready to copy, is in `docs/next-prompts.md`.

Workflow: generate in Gemini (new chat, image tool, one prompt per message), download each image right after it is made, then run `node scripts/name-recipe-images.mjs` (it names the downloads by prompt order) and `node scripts/prepare-recipe-images.mjs` (cuts out white or green backgrounds, 512px webp into `public/recipes/`). Claude then adds the recipe and the slug to `WITH_IMAGE` in `src/data/recipes/demo.ts`.
## How it was chosen
Starting list, not a ranked top 200. Sources were Google 2025 recipe searches (Marry me chicken, hot honey, cottage cheese bowls, lasagna soup, cabbage boil, zucchini and banana bread, protein muffins, ditalini salad), US cuisine favourites for Gen Z and millennials (Mexican, Chinese, Italian first), student budget and high-protein meals, plus Indian dishes because the app already has them. No source gave a ranked 200, so review the list before you generate: cut what you will not cook, add what you will.

## Style block (paste before every dish)
```
Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

## Background removal
Plain white in, transparent out. Run the finished folder through `rembg` (or any cutout tool) and check the edges on a coloured tile. In the app the dish sits on the recipe's own pastel `tint`; the shadow is drawn in CSS, not in the image. If your generator can output a transparent background by itself (OpenAI `gpt-image-1`), use that and skip this step.

## Checklist per image
- One dish, centered, same top-down angle, same outline weight, pure white background (so the cutout is clean).
- No text or logos in the image. Reject images with hands, extra plates or wrong ingredients (a veg dish must show no meat).
- Name the file exactly the slug: `scripts/name-recipe-images.mjs` does it from download order.

## Recipes
Prompt = style block + the line below.

| # | slug | name | diet | cuisine | subject line | image |
|---|---|---|---|---|---|---|
| 1 | oats-banana | Oats and banana | vegan | American | bowl of creamy oats topped with sliced banana, cinnamon and a drizzle of honey | done |
| 2 | overnight-oats | Overnight oats with berries | veg | American | glass jar of overnight oats layered with blueberries and strawberries | done |
| 3 | cottage-cheese-bowl | Cottage cheese bowl | veg | Viral | bowl of cottage cheese topped with sliced peaches, honey and crushed nuts | done |
| 4 | greek-yogurt-parfait | Greek yogurt parfait | veg | American | tall glass with layers of Greek yogurt, granola and mixed berries | done |
| 5 | protein-muffins | Protein muffins | egg | Viral | three golden muffins with chocolate chips, one broken open | done |
| 6 | banana-bread | Banana bread | egg | American | sliced loaf of banana bread, golden crust, one slice leaning on the loaf | done |
| 7 | zucchini-bread | Zucchini bread | egg | American | sliced zucchini bread with flecks of green and a pat of butter | done |
| 8 | pancakes | Pancakes | egg | American | stack of three fluffy pancakes with butter and maple syrup running down | done |
| 9 | french-toast | French toast | egg | American | two slices of golden French toast dusted with sugar and berries | done |
| 10 | avocado-toast | Avocado toast with egg | egg | American | sourdough toast with smashed avocado, a fried egg, chili flakes | done |
| 11 | omelette | Veggie omelette | egg | American | folded omelette with visible tomato, onion and pepper, on a plate | done |
| 12 | scrambled-eggs | Scrambled eggs on toast | egg | American | soft scrambled eggs on toasted bread with chives | done |
| 13 | breakfast-burrito | Breakfast burrito | egg | Mexican | burrito cut in half showing eggs, potato, cheese and salsa | done |
| 14 | egg-fried-rice | Egg fried rice | egg | Chinese | wok-style fried rice with scrambled egg, peas, carrot and spring onion | done |
| 15 | shakshuka | Shakshuka | egg | Mediterranean | skillet of tomato sauce with two poached eggs, feta and parsley | done |
| 16 | smoothie-bowl | Smoothie bowl | vegan | American | purple smoothie bowl topped with banana, granola and seeds | done |
| 17 | peanut-butter-toast | Peanut butter banana toast | vegan | American | toast with peanut butter and banana slices and a sprinkle of chia | done |
| 18 | poha | Poha | vegan | Indian | plate of yellow flattened rice with peanuts, curry leaves and lemon wedge | done |
| 19 | upma | Upma | vegan | Indian | bowl of semolina upma with mustard seeds, carrot, peas and coriander | done |
| 20 | idli-sambar | Idli with sambar | vegan | Indian | three white idlis next to a bowl of orange sambar and coconut chutney | done |
| 21 | masala-dosa | Masala dosa | vegan | Indian | large crisp golden dosa rolled with potato filling, with two chutneys | done |
| 22 | aloo-paratha | Aloo paratha | veg | Indian | two stuffed flatbreads with a dollop of butter and a bowl of yogurt | done |
| 23 | dal-tadka | Dal tadka | vegan | Indian | bowl of yellow dal with a sizzling red chili and cumin tempering on top | done |
| 24 | dal-rice | Dal and rice | vegan | Indian | plate with yellow dal poured over white rice, a lemon wedge and coriander | done |
| 25 | khichdi | Khichdi | vegan | Indian | bowl of soft yellow rice and lentil khichdi with a spoon of ghee | done |
| 26 | chana-masala | Chana masala | vegan | Indian | bowl of chickpeas in thick red-brown masala with onion rings and coriander | done |
| 27 | rajma | Rajma | vegan | Indian | bowl of kidney bean curry in dark red gravy, served with rice | done |
| 28 | palak-paneer | Palak paneer | veg | Indian | bowl of green spinach gravy with white paneer cubes and a swirl of cream | done |
| 29 | paneer-butter-masala | Paneer butter masala | veg | Indian | bowl of orange creamy gravy with paneer cubes, cream swirl and coriander | done |
| 30 | paneer-tikka | Paneer tikka | veg | Indian | skewers of charred paneer, peppers and onion with mint chutney | done |
| 31 | aloo-gobi | Aloo gobi | vegan | Indian | dry curry of yellow-spiced potato and cauliflower florets | done |
| 32 | baingan-bharta | Baingan bharta | vegan | Indian | bowl of smoky mashed eggplant in tomato and onion, coriander on top | done |
| 33 | veg-biryani | Vegetable biryani | veg | Indian | pot of layered biryani rice with vegetables, fried onions and mint | done |
| 34 | chicken-biryani | Chicken biryani | chicken | Indian | pot of biryani with chicken pieces, saffron rice and fried onions | done |
| 35 | butter-chicken | Butter chicken | chicken | Indian | bowl of orange creamy butter chicken with naan on the side | done |
| 36 | chicken-tikka-masala | Chicken tikka masala | chicken | Indian | bowl of red-orange masala with charred chicken pieces and cream | done |
| 37 | chicken-curry | Chicken curry | chicken | Indian | bowl of home-style chicken curry with bone-in pieces, red-brown gravy | done |
| 38 | mutton-curry | Mutton curry | beef | Indian | bowl of dark thick mutton gravy with tender pieces and whole spices | done |
| 39 | egg-curry | Egg curry | egg | Indian | bowl of halved boiled eggs in red onion-tomato gravy | done |
| 40 | fish-curry | Fish curry | fish | Indian | bowl of fish pieces in tangy orange-red coconut gravy | done |
| 41 | tandoori-chicken | Tandoori chicken | chicken | Indian | charred red chicken legs with onion rings and lemon | done |
| 42 | samosa | Samosas with chutney | vegan | Indian | three golden triangular samosas with green and tamarind chutney | done |
| 43 | curd-rice | Curd rice | veg | Indian | white bowl of curd rice with pomegranate and curry leaf tempering | done |
| 44 | tacos-chicken | Chicken tacos | chicken | Mexican | three small tacos with grilled chicken, cilantro, onion and lime | done |
| 45 | tacos-beef | Beef tacos | beef | Mexican | three crisp tacos with ground beef, lettuce, tomato and cheese | done |
| 46 | fish-tacos | Fish tacos | fish | Mexican | two tacos with crispy fish, cabbage slaw and lime crema | done |
| 47 | veggie-tacos | Black bean tacos | vegan | Mexican | three tacos with black beans, corn, avocado and salsa | done |
| 48 | quesadilla | Cheese quesadilla | veg | Mexican | golden folded quesadilla cut in triangles, melted cheese visible, with salsa | done |
| 49 | chicken-burrito-bowl | Chicken burrito bowl | chicken | Mexican | bowl of rice, black beans, grilled chicken, corn, salsa and avocado | done |
| 50 | burrito | Bean and rice burrito | vegan | Mexican | burrito cut in half showing rice, beans and salsa | done |
| 51 | nachos | Loaded nachos | veg | Mexican | plate of chips with melted cheese, jalapeno, beans and sour cream | done |
| 52 | enchiladas | Chicken enchiladas | chicken | Mexican | baking dish of rolled tortillas under red sauce and melted cheese | done |
| 53 | chilaquiles | Chilaquiles | egg | Mexican | plate of tortilla chips in red salsa with fried egg and queso fresco | done |
| 54 | guacamole | Guacamole and chips | vegan | Mexican | bowl of chunky guacamole with tortilla chips and lime | done |
| 55 | rice-and-beans | Rice and beans | vegan | Latin | bowl of white rice with stewed black beans and lime | done |
| 56 | chili | Beef chili | beef | American | bowl of thick red chili with beans, shredded cheese and sour cream | done |
| 57 | veg-chili | Three bean chili | vegan | American | bowl of chili with kidney, black and pinto beans and cilantro | done |
| 58 | spaghetti-meatballs | Spaghetti and meatballs | beef | Italian | plate of spaghetti with tomato sauce, three meatballs, basil and parmesan | done |
| 59 | spaghetti-marinara | Spaghetti marinara | vegan | Italian | plate of spaghetti in red tomato sauce with basil | done |
| 60 | pasta-alfredo | Chicken alfredo | chicken | Italian | plate of fettuccine in white cream sauce with sliced chicken and parsley | done |
| 61 | penne-arrabbiata | Penne arrabbiata | vegan | Italian | plate of penne in spicy red sauce with chili flakes and parsley | done |
| 62 | pasta-pesto | Pesto pasta | veg | Italian | plate of fusilli in green pesto with cherry tomatoes and pine nuts | done |
| 63 | mac-and-cheese | Mac and cheese | veg | American | bowl of creamy macaroni and cheese with a crisp top | done |
| 64 | lasagna | Lasagna | beef | Italian | square slice of lasagna showing layers of pasta, meat sauce and cheese | done |
| 65 | lasagna-soup | Lasagna soup | beef | Viral | bowl of red tomato soup with lasagna noodles, meat, ricotta dollop and basil | done |
| 66 | carbonara | Spaghetti carbonara | pork | Italian | plate of spaghetti with egg sauce, crispy pancetta and black pepper | done |
| 67 | garlic-butter-shrimp-pasta | Garlic shrimp pasta | shrimp | Italian | plate of linguine with pink shrimp, garlic, parsley and lemon | done |
| 68 | marry-me-chicken | Marry me chicken | chicken | Viral | golden chicken thighs in creamy sun-dried tomato sauce with basil | done |
| 69 | creamy-tuscan-chicken | Creamy Tuscan chicken | chicken | Italian | seared chicken in cream sauce with spinach and sun-dried tomatoes | done |
| 70 | chicken-parmesan | Chicken parmesan | chicken | Italian | crumbed chicken cutlet with tomato sauce and melted mozzarella on spaghetti | done |
| 71 | margherita-pizza | Margherita pizza | veg | Italian | round pizza with melted mozzarella, tomato and basil leaves, one slice lifted | done |
| 72 | veggie-pizza | Veggie flatbread pizza | veg | Italian | flatbread pizza with peppers, mushrooms, olives and cheese | done |
| 73 | minestrone | Minestrone | vegan | Italian | bowl of vegetable soup with beans, pasta, carrot and basil | done |
| 74 | tomato-soup-grilled-cheese | Tomato soup and grilled cheese | veg | American | bowl of tomato soup beside a toasted cheese sandwich cut in half | done |
| 75 | chicken-noodle-soup | Chicken noodle soup | chicken | American | bowl of clear broth with noodles, chicken, carrot and celery | done |
| 76 | meatloaf | Meatloaf | beef | American | slice of glazed meatloaf with mashed potato and green beans | done |
| 77 | cheeseburger | Cheeseburger | beef | American | burger with melted cheese, lettuce, tomato and pickles beside fries | done |
| 78 | turkey-burger | Turkey burger | chicken | American | burger on a bun with lettuce, tomato and avocado | done |
| 79 | chicken-sandwich | Crispy chicken sandwich | chicken | American | crispy chicken fillet in a bun with pickles and sauce | done |
| 80 | blt-sandwich | BLT sandwich | pork | American | toasted sandwich with bacon, lettuce and tomato cut diagonally | done |
| 81 | grilled-cheese | Grilled cheese | veg | American | golden toasted cheese sandwich cut in half with cheese stretching | done |
| 82 | tuna-melt | Tuna melt | fish | American | open toasted sandwich with tuna and melted cheese | done |
| 83 | chicken-wrap | Chicken Caesar wrap | chicken | American | halved wrap showing chicken, lettuce and parmesan | done |
| 84 | turkey-sandwich | Turkey and cheese sandwich | chicken | American | sandwich with turkey, cheese, lettuce and tomato | done |
| 85 | sheet-pan-chicken-veg | Sheet pan chicken and vegetables | chicken | American | baking sheet with roasted chicken thighs, broccoli, potato and carrots | done |
| 86 | roast-chicken | Roast chicken | chicken | American | golden whole roast chicken with lemon and herbs | done |
| 87 | hot-honey-chicken | Hot honey chicken | chicken | Viral | crispy chicken pieces glazed with shiny orange hot honey | done |
| 88 | hot-honey-bowl | Hot honey chicken bowl | chicken | Viral | bowl of rice and chicken with cottage cheese, sweet potato and a honey drizzle | done |
| 89 | chimichurri-chicken | Chimichurri chicken | chicken | Latin | grilled chicken breast topped with green chimichurri and a lemon wedge | done |
| 90 | chicken-rice-broccoli | Chicken, rice and broccoli | chicken | American | meal prep tray of sliced chicken, white rice and broccoli | done |
| 91 | bbq-chicken | BBQ chicken | chicken | American | glossy BBQ-glazed chicken legs with corn on the cob | done |
| 92 | baked-salmon | Baked salmon with asparagus | fish | American | salmon fillet with lemon slices and green asparagus | done |
| 93 | fish-and-chips | Fish and chips | fish | American | crispy battered fish with chunky fries and lemon | done |
| 94 | shrimp-stir-fry | Shrimp stir fry | shrimp | Chinese | wok of pink shrimp with broccoli, pepper and glossy sauce | done |
| 95 | steak-and-potatoes | Steak and potatoes | beef | American | sliced seared steak with roasted potatoes and rosemary | done |
| 96 | pork-chops | Pork chops with apples | pork | American | two seared pork chops with caramelized apple slices | done |
| 97 | pulled-pork-sandwich | Pulled pork sandwich | pork | American | bun piled with pulled pork and coleslaw | done |
| 98 | cabbage-boil | Cabbage and sausage boil | pork | Viral | bowl of cabbage wedges, potato, corn and sliced sausage in broth | done |
| 99 | stuffed-peppers | Stuffed peppers | beef | American | halved bell peppers filled with rice, beef and melted cheese | done |
| 100 | beef-stew | Beef stew | beef | American | bowl of beef stew with carrot, potato and peas | done |
| 101 | pot-roast | Pot roast | beef | American | sliced pot roast with carrots and potatoes in gravy | done |
| 102 | meatball-subs | Meatball sub | beef | American | toasted roll with meatballs, red sauce and melted cheese | done |
| 103 | baked-potato | Loaded baked potato | veg | American | split baked potato with cheese, sour cream and chives | done |
| 104 | mashed-potatoes | Mashed potatoes | veg | American | bowl of fluffy mashed potatoes with a melting butter pool | done |
| 105 | roasted-veg | Roasted vegetables | vegan | American | tray of roasted broccoli, carrots, zucchini and peppers | done |
| 106 | caesar-salad | Chicken Caesar salad | chicken | American | bowl of romaine with croutons, parmesan and sliced chicken | done |
| 107 | greek-salad | Greek salad | veg | Mediterranean | bowl of cucumber, tomato, olives, red onion and feta block | done |
| 108 | chopped-salad | Ditalini chopped salad | veg | Viral | bowl of finely chopped salad with small pasta, salami-free veg and cheese | done |
| 109 | cobb-salad | Cobb salad | egg | American | rows of chicken, egg, avocado, tomato and bacon on lettuce | done |
| 110 | quinoa-bowl | Quinoa veggie bowl | vegan | Mediterranean | bowl of quinoa with chickpeas, cucumber, tomato and tahini | done |
| 111 | buddha-bowl | Buddha bowl | vegan | American | bowl with rice, sweet potato, kale, chickpeas and avocado | needed |
| 112 | hummus-plate | Hummus and pita | vegan | Mediterranean | bowl of hummus with olive oil, paprika and warm pita wedges | needed |
| 113 | falafel-wrap | Falafel wrap | vegan | Mediterranean | wrap showing falafel, lettuce, tomato and tahini sauce | needed |
| 114 | chicken-shawarma-bowl | Chicken shawarma bowl | chicken | Mediterranean | bowl of spiced chicken, rice, cucumber, tomato and white sauce | needed |
| 115 | chicken-stir-fry | Chicken and veggie stir fry | chicken | Chinese | wok of chicken with broccoli, carrots and peppers in glossy sauce | needed |
| 116 | beef-broccoli | Beef and broccoli | beef | Chinese | plate of sliced beef and broccoli in dark sauce over rice | needed |
| 117 | kung-pao-chicken | Kung pao chicken | chicken | Chinese | plate of chicken, peanuts and dried red chilies in glossy sauce | needed |
| 118 | sweet-sour-chicken | Sweet and sour chicken | chicken | Chinese | plate of battered chicken with pineapple and peppers in red sauce | needed |
| 119 | veg-fried-rice | Vegetable fried rice | vegan | Chinese | bowl of fried rice with carrot, peas, corn and spring onion | needed |
| 120 | chow-mein | Veggie chow mein | vegan | Chinese | plate of stir-fried noodles with cabbage, carrot and peppers | needed |
| 121 | mapo-tofu | Mapo tofu | vegan | Chinese | bowl of soft tofu cubes in red chili sauce with green onion | needed |
| 122 | dumplings | Pan-fried dumplings | pork | Chinese | plate of crisp-bottomed dumplings with dipping sauce | needed |
| 123 | ramen-egg | Ramen with egg | egg | Japanese | bowl of instant-style ramen with a halved soft egg, spring onion and nori | needed |
| 124 | chicken-teriyaki | Chicken teriyaki | chicken | Japanese | glazed chicken over rice with sesame seeds and broccoli | needed |
| 125 | salmon-rice-bowl | Salmon rice bowl | fish | Japanese | bowl of rice with flaked salmon, cucumber, avocado and sesame | needed |
| 126 | katsu-curry | Chicken katsu curry | chicken | Japanese | sliced crumbed chicken over rice with brown curry sauce | needed |
| 127 | miso-soup | Miso soup with tofu | vegan | Japanese | bowl of miso soup with tofu cubes, seaweed and spring onion | needed |
| 128 | bibimbap | Bibimbap | egg | Korean | bowl of rice with colored vegetable piles, beef, fried egg and red gochujang | needed |
| 129 | korean-fried-chicken | Korean fried chicken | chicken | Korean | crispy chicken pieces glazed with red sticky sauce and sesame | needed |
| 130 | kimchi-fried-rice | Kimchi fried rice | egg | Korean | bowl of red-tinted fried rice topped with a fried egg and seaweed | needed |
| 131 | tteokbokki | Tteokbokki | vegan | Korean | bowl of chewy rice cakes in red spicy sauce with green onion | needed |
| 132 | pad-thai | Pad Thai | shrimp | Thai | plate of noodles with shrimp, peanuts, bean sprouts and lime | needed |
| 133 | thai-green-curry | Thai green curry | chicken | Thai | bowl of pale green coconut curry with chicken and basil, with rice | needed |
| 134 | thai-basil-chicken | Thai basil chicken | chicken | Thai | plate of minced chicken and basil over rice with a fried egg | needed |
| 135 | veg-curry-coconut | Coconut vegetable curry | vegan | Thai | bowl of vegetables in yellow coconut curry over rice | needed |
| 136 | pho | Chicken pho | chicken | Vietnamese | bowl of clear broth with rice noodles, chicken, herbs and lime | needed |
| 137 | banh-mi | Banh mi sandwich | pork | Vietnamese | baguette with meat, pickled carrot, cucumber and cilantro | needed |
| 138 | lentil-soup | Lentil soup | vegan | Mediterranean | bowl of orange-brown lentil soup with lemon and parsley | needed |
| 139 | black-bean-soup | Black bean soup | vegan | Latin | bowl of dark bean soup with sour cream and cilantro | needed |
| 140 | broccoli-cheddar-soup | Broccoli cheddar soup | veg | American | bowl of creamy soup with broccoli and shredded cheddar | needed |
| 141 | tofu-scramble | Tofu scramble | vegan | American | plate of yellow crumbled tofu with spinach and peppers beside toast | needed |
| 142 | chickpea-salad-sandwich | Chickpea salad sandwich | vegan | American | sandwich with mashed chickpea salad, lettuce and tomato | needed |
| 143 | sweet-potato-bowl | Sweet potato and black bean bowl | vegan | American | bowl of roasted sweet potato, black beans, avocado and lime | needed |
| 144 | tuna-salad | Tuna salad bowl | fish | American | bowl of tuna with cucumber, tomato and greens | needed |
| 145 | egg-salad-sandwich | Egg salad sandwich | egg | American | sandwich with chopped egg salad and lettuce, cut in half | needed |
| 146 | cottage-cheese-pancakes | Cottage cheese pancakes | egg | Viral | stack of thin pancakes with berries and yogurt | needed |
| 147 | peanut-noodles | Peanut noodles | vegan | American | bowl of noodles in peanut sauce with cucumber, carrot and sesame | needed |
| 148 | ramen-veg | Veggie ramen | vegan | Japanese | bowl of ramen with mushrooms, corn, spinach and nori | needed |
| 149 | chole-bhature | Chole bhature | vegan | Indian | plate with chickpea curry and two puffed bhature together | done |
| 150 | malai-kofta | Malai kofta with rice | veg | Indian | koftas in creamy gravy with rice on one plate | done |
| 151 | bhindi-masala | Bhindi masala | vegan | Indian | okra stir-fried with onion and tomato | done |
| 152 | veg-jalfrezi | Vegetable jalfrezi | vegan | Indian | strips of peppers, carrots and beans in tomato sauce | done |
| 153 | navratan-korma | Navratan korma | veg | Indian | vegetables, paneer and nuts in creamy gravy | done |
| 154 | shahi-paneer | Shahi paneer | veg | Indian | paneer in yellow-orange cream gravy | done |
| 155 | kadai-paneer | Kadai paneer | veg | Indian | paneer with peppers, onion petals and red chillies | done |
| 156 | chilli-paneer | Chilli paneer | veg | Indo-Chinese | crisp paneer with peppers in red chilli sauce | done |
| 157 | mushroom-masala | Mushroom masala | vegan | Indian | mushrooms in dark onion tomato gravy | done |
| 158 | paneer-bhurji | Paneer bhurji | veg | Indian | scrambled paneer with onion, tomato and lime | done |

## Full prompts (copy one block per image)

**oats-banana**
```
Oats and banana: bowl of creamy oats topped with sliced banana, cinnamon and a drizzle of honey. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**overnight-oats**
```
Overnight oats with berries: glass jar of overnight oats layered with blueberries and strawberries. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**cottage-cheese-bowl**
```
Cottage cheese bowl: bowl of cottage cheese topped with sliced peaches, honey and crushed nuts. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**greek-yogurt-parfait**
```
Greek yogurt parfait: tall glass with layers of Greek yogurt, granola and mixed berries. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**protein-muffins**
```
Protein muffins: three golden muffins with chocolate chips, one broken open. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**banana-bread**
```
Banana bread: sliced loaf of banana bread, golden crust, one slice leaning on the loaf. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**zucchini-bread**
```
Zucchini bread: sliced zucchini bread with flecks of green and a pat of butter. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pancakes**
```
Pancakes: stack of three fluffy pancakes with butter and maple syrup running down. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**french-toast**
```
French toast: two slices of golden French toast dusted with sugar and berries. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**avocado-toast**
```
Avocado toast with egg: sourdough toast with smashed avocado, a fried egg, chili flakes. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**omelette**
```
Veggie omelette: folded omelette with visible tomato, onion and pepper, on a plate. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**scrambled-eggs**
```
Scrambled eggs on toast: soft scrambled eggs on toasted bread with chives. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**breakfast-burrito**
```
Breakfast burrito: burrito cut in half showing eggs, potato, cheese and salsa. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**egg-fried-rice**
```
Egg fried rice: wok-style fried rice with scrambled egg, peas, carrot and spring onion. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**shakshuka**
```
Shakshuka: skillet of tomato sauce with two poached eggs, feta and parsley. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**smoothie-bowl**
```
Smoothie bowl: purple smoothie bowl topped with banana, granola and seeds. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**peanut-butter-toast**
```
Peanut butter banana toast: toast with peanut butter and banana slices and a sprinkle of chia. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**poha**
```
Poha: plate of yellow flattened rice with peanuts, curry leaves and lemon wedge. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**upma**
```
Upma: bowl of semolina upma with mustard seeds, carrot, peas and coriander. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**idli-sambar**
```
Idli with sambar: three white idlis next to a bowl of orange sambar and coconut chutney. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**masala-dosa**
```
Masala dosa: large crisp golden dosa rolled with potato filling, with two chutneys. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**aloo-paratha**
```
Aloo paratha: two stuffed flatbreads with a dollop of butter and a bowl of yogurt. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**dal-tadka**
```
Dal tadka: bowl of yellow dal with a sizzling red chili and cumin tempering on top. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**dal-rice**
```
Dal and rice: plate with yellow dal poured over white rice, a lemon wedge and coriander. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**khichdi**
```
Khichdi: bowl of soft yellow rice and lentil khichdi with a spoon of ghee. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chana-masala**
```
Chana masala: bowl of chickpeas in thick red-brown masala with onion rings and coriander. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**rajma**
```
Rajma: bowl of kidney bean curry in dark red gravy, served with rice. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**palak-paneer**
```
Palak paneer: bowl of green spinach gravy with white paneer cubes and a swirl of cream. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**paneer-butter-masala**
```
Paneer butter masala: bowl of orange creamy gravy with paneer cubes, cream swirl and coriander. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**paneer-tikka**
```
Paneer tikka: skewers of charred paneer, peppers and onion with mint chutney. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**aloo-gobi**
```
Aloo gobi: dry curry of yellow-spiced potato and cauliflower florets. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**baingan-bharta**
```
Baingan bharta: bowl of smoky mashed eggplant in tomato and onion, coriander on top. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**veg-biryani**
```
Vegetable biryani: pot of layered biryani rice with vegetables, fried onions and mint. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-biryani**
```
Chicken biryani: pot of biryani with chicken pieces, saffron rice and fried onions. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**butter-chicken**
```
Butter chicken: bowl of orange creamy butter chicken with naan on the side. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-tikka-masala**
```
Chicken tikka masala: bowl of red-orange masala with charred chicken pieces and cream. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-curry**
```
Chicken curry: bowl of home-style chicken curry with bone-in pieces, red-brown gravy. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**mutton-curry**
```
Mutton curry: bowl of dark thick mutton gravy with tender pieces and whole spices. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**egg-curry**
```
Egg curry: bowl of halved boiled eggs in red onion-tomato gravy. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**fish-curry**
```
Fish curry: bowl of fish pieces in tangy orange-red coconut gravy. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tandoori-chicken**
```
Tandoori chicken: charred red chicken legs with onion rings and lemon. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**samosa**
```
Samosas with chutney: three golden triangular samosas with green and tamarind chutney. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**curd-rice**
```
Curd rice: white bowl of curd rice with pomegranate and curry leaf tempering. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tacos-chicken**
```
Chicken tacos: three small tacos with grilled chicken, cilantro, onion and lime. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tacos-beef**
```
Beef tacos: three crisp tacos with ground beef, lettuce, tomato and cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**fish-tacos**
```
Fish tacos: two tacos with crispy fish, cabbage slaw and lime crema. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**veggie-tacos**
```
Black bean tacos: three tacos with black beans, corn, avocado and salsa. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**quesadilla**
```
Cheese quesadilla: golden folded quesadilla cut in triangles, melted cheese visible, with salsa. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-burrito-bowl**
```
Chicken burrito bowl: bowl of rice, black beans, grilled chicken, corn, salsa and avocado. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**burrito**
```
Bean and rice burrito: burrito cut in half showing rice, beans and salsa. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**nachos**
```
Loaded nachos: plate of chips with melted cheese, jalapeno, beans and sour cream. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**enchiladas**
```
Chicken enchiladas: baking dish of rolled tortillas under red sauce and melted cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chilaquiles**
```
Chilaquiles: plate of tortilla chips in red salsa with fried egg and queso fresco. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**guacamole**
```
Guacamole and chips: bowl of chunky guacamole with tortilla chips and lime. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**rice-and-beans**
```
Rice and beans: bowl of white rice with stewed black beans and lime. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chili**
```
Beef chili: bowl of thick red chili with beans, shredded cheese and sour cream. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**veg-chili**
```
Three bean chili: bowl of chili with kidney, black and pinto beans and cilantro. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**spaghetti-meatballs**
```
Spaghetti and meatballs: plate of spaghetti with tomato sauce, three meatballs, basil and parmesan. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**spaghetti-marinara**
```
Spaghetti marinara: plate of spaghetti in red tomato sauce with basil. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pasta-alfredo**
```
Chicken alfredo: plate of fettuccine in white cream sauce with sliced chicken and parsley. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**penne-arrabbiata**
```
Penne arrabbiata: plate of penne in spicy red sauce with chili flakes and parsley. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pasta-pesto**
```
Pesto pasta: plate of fusilli in green pesto with cherry tomatoes and pine nuts. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**mac-and-cheese**
```
Mac and cheese: bowl of creamy macaroni and cheese with a crisp top. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**lasagna**
```
Lasagna: square slice of lasagna showing layers of pasta, meat sauce and cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**lasagna-soup**
```
Lasagna soup: bowl of red tomato soup with lasagna noodles, meat, ricotta dollop and basil. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**carbonara**
```
Spaghetti carbonara: plate of spaghetti with egg sauce, crispy pancetta and black pepper. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**garlic-butter-shrimp-pasta**
```
Garlic shrimp pasta: plate of linguine with pink shrimp, garlic, parsley and lemon. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**marry-me-chicken**
```
Marry me chicken: golden chicken thighs in creamy sun-dried tomato sauce with basil. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**creamy-tuscan-chicken**
```
Creamy Tuscan chicken: seared chicken in cream sauce with spinach and sun-dried tomatoes. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-parmesan**
```
Chicken parmesan: crumbed chicken cutlet with tomato sauce and melted mozzarella on spaghetti. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**margherita-pizza**
```
Margherita pizza: round pizza with melted mozzarella, tomato and basil leaves, one slice lifted. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**veggie-pizza**
```
Veggie flatbread pizza: flatbread pizza with peppers, mushrooms, olives and cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**minestrone**
```
Minestrone: bowl of vegetable soup with beans, pasta, carrot and basil. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tomato-soup-grilled-cheese**
```
Tomato soup and grilled cheese: bowl of tomato soup beside a toasted cheese sandwich cut in half. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-noodle-soup**
```
Chicken noodle soup: bowl of clear broth with noodles, chicken, carrot and celery. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**meatloaf**
```
Meatloaf: slice of glazed meatloaf with mashed potato and green beans. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**cheeseburger**
```
Cheeseburger: burger with melted cheese, lettuce, tomato and pickles beside fries. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**turkey-burger**
```
Turkey burger: burger on a bun with lettuce, tomato and avocado. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-sandwich**
```
Crispy chicken sandwich: crispy chicken fillet in a bun with pickles and sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**blt-sandwich**
```
BLT sandwich: toasted sandwich with bacon, lettuce and tomato cut diagonally. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**grilled-cheese**
```
Grilled cheese: golden toasted cheese sandwich cut in half with cheese stretching. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tuna-melt**
```
Tuna melt: open toasted sandwich with tuna and melted cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-wrap**
```
Chicken Caesar wrap: halved wrap showing chicken, lettuce and parmesan. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**turkey-sandwich**
```
Turkey and cheese sandwich: sandwich with turkey, cheese, lettuce and tomato. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**sheet-pan-chicken-veg**
```
Sheet pan chicken and vegetables: baking sheet with roasted chicken thighs, broccoli, potato and carrots. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**roast-chicken**
```
Roast chicken: golden whole roast chicken with lemon and herbs. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**hot-honey-chicken**
```
Hot honey chicken: crispy chicken pieces glazed with shiny orange hot honey. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**hot-honey-bowl**
```
Hot honey chicken bowl: bowl of rice and chicken with cottage cheese, sweet potato and a honey drizzle. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chimichurri-chicken**
```
Chimichurri chicken: grilled chicken breast topped with green chimichurri and a lemon wedge. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-rice-broccoli**
```
Chicken, rice and broccoli: meal prep tray of sliced chicken, white rice and broccoli. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**bbq-chicken**
```
BBQ chicken: glossy BBQ-glazed chicken legs with corn on the cob. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**baked-salmon**
```
Baked salmon with asparagus: salmon fillet with lemon slices and green asparagus. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**fish-and-chips**
```
Fish and chips: crispy battered fish with chunky fries and lemon. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**shrimp-stir-fry**
```
Shrimp stir fry: wok of pink shrimp with broccoli, pepper and glossy sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**steak-and-potatoes**
```
Steak and potatoes: sliced seared steak with roasted potatoes and rosemary. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pork-chops**
```
Pork chops with apples: two seared pork chops with caramelized apple slices. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pulled-pork-sandwich**
```
Pulled pork sandwich: bun piled with pulled pork and coleslaw. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**cabbage-boil**
```
Cabbage and sausage boil: bowl of cabbage wedges, potato, corn and sliced sausage in broth. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**stuffed-peppers**
```
Stuffed peppers: halved bell peppers filled with rice, beef and melted cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**beef-stew**
```
Beef stew: bowl of beef stew with carrot, potato and peas. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pot-roast**
```
Pot roast: sliced pot roast with carrots and potatoes in gravy. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**meatball-subs**
```
Meatball sub: toasted roll with meatballs, red sauce and melted cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**baked-potato**
```
Loaded baked potato: split baked potato with cheese, sour cream and chives. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**mashed-potatoes**
```
Mashed potatoes: bowl of fluffy mashed potatoes with a melting butter pool. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**roasted-veg**
```
Roasted vegetables: tray of roasted broccoli, carrots, zucchini and peppers. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**caesar-salad**
```
Chicken Caesar salad: bowl of romaine with croutons, parmesan and sliced chicken. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**greek-salad**
```
Greek salad: bowl of cucumber, tomato, olives, red onion and feta block. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chopped-salad**
```
Ditalini chopped salad: bowl of finely chopped salad with small pasta, salami-free veg and cheese. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**cobb-salad**
```
Cobb salad: rows of chicken, egg, avocado, tomato and bacon on lettuce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**quinoa-bowl**
```
Quinoa veggie bowl: bowl of quinoa with chickpeas, cucumber, tomato and tahini. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**buddha-bowl**
```
Buddha bowl: bowl with rice, sweet potato, kale, chickpeas and avocado. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**hummus-plate**
```
Hummus and pita: bowl of hummus with olive oil, paprika and warm pita wedges. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**falafel-wrap**
```
Falafel wrap: wrap showing falafel, lettuce, tomato and tahini sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-shawarma-bowl**
```
Chicken shawarma bowl: bowl of spiced chicken, rice, cucumber, tomato and white sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-stir-fry**
```
Chicken and veggie stir fry: wok of chicken with broccoli, carrots and peppers in glossy sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**beef-broccoli**
```
Beef and broccoli: plate of sliced beef and broccoli in dark sauce over rice. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**kung-pao-chicken**
```
Kung pao chicken: plate of chicken, peanuts and dried red chilies in glossy sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**sweet-sour-chicken**
```
Sweet and sour chicken: plate of battered chicken with pineapple and peppers in red sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**veg-fried-rice**
```
Vegetable fried rice: bowl of fried rice with carrot, peas, corn and spring onion. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chow-mein**
```
Veggie chow mein: plate of stir-fried noodles with cabbage, carrot and peppers. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**mapo-tofu**
```
Mapo tofu: bowl of soft tofu cubes in red chili sauce with green onion. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**dumplings**
```
Pan-fried dumplings: plate of crisp-bottomed dumplings with dipping sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**ramen-egg**
```
Ramen with egg: bowl of instant-style ramen with a halved soft egg, spring onion and nori. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chicken-teriyaki**
```
Chicken teriyaki: glazed chicken over rice with sesame seeds and broccoli. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**salmon-rice-bowl**
```
Salmon rice bowl: bowl of rice with flaked salmon, cucumber, avocado and sesame. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**katsu-curry**
```
Chicken katsu curry: sliced crumbed chicken over rice with brown curry sauce. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**miso-soup**
```
Miso soup with tofu: bowl of miso soup with tofu cubes, seaweed and spring onion. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**bibimbap**
```
Bibimbap: bowl of rice with colored vegetable piles, beef, fried egg and red gochujang. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**korean-fried-chicken**
```
Korean fried chicken: crispy chicken pieces glazed with red sticky sauce and sesame. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**kimchi-fried-rice**
```
Kimchi fried rice: bowl of red-tinted fried rice topped with a fried egg and seaweed. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tteokbokki**
```
Tteokbokki: bowl of chewy rice cakes in red spicy sauce with green onion. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pad-thai**
```
Pad Thai: plate of noodles with shrimp, peanuts, bean sprouts and lime. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**thai-green-curry**
```
Thai green curry: bowl of pale green coconut curry with chicken and basil, with rice. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**thai-basil-chicken**
```
Thai basil chicken: plate of minced chicken and basil over rice with a fried egg. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**veg-curry-coconut**
```
Coconut vegetable curry: bowl of vegetables in yellow coconut curry over rice. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**pho**
```
Chicken pho: bowl of clear broth with rice noodles, chicken, herbs and lime. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**banh-mi**
```
Banh mi sandwich: baguette with meat, pickled carrot, cucumber and cilantro. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**lentil-soup**
```
Lentil soup: bowl of orange-brown lentil soup with lemon and parsley. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**black-bean-soup**
```
Black bean soup: bowl of dark bean soup with sour cream and cilantro. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**broccoli-cheddar-soup**
```
Broccoli cheddar soup: bowl of creamy soup with broccoli and shredded cheddar. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tofu-scramble**
```
Tofu scramble: plate of yellow crumbled tofu with spinach and peppers beside toast. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**chickpea-salad-sandwich**
```
Chickpea salad sandwich: sandwich with mashed chickpea salad, lettuce and tomato. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**sweet-potato-bowl**
```
Sweet potato and black bean bowl: bowl of roasted sweet potato, black beans, avocado and lime. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**tuna-salad**
```
Tuna salad bowl: bowl of tuna with cucumber, tomato and greens. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**egg-salad-sandwich**
```
Egg salad sandwich: sandwich with chopped egg salad and lettuce, cut in half. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**cottage-cheese-pancakes**
```
Cottage cheese pancakes: stack of thin pancakes with berries and yogurt. Flat vector food illustration, top-down view, one dish in a pl
ain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**peanut-noodles**
```
Peanut noodles: bowl of noodles in peanut sauce with cucumber, carrot and sesame. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

**ramen-veg**
```
Veggie ramen: bowl of ramen with mushrooms, corn, spinach and nori. Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```
