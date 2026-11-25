# Remaining images: one prompt file

38 dishes from the planned list, 9 dishes already in the app without a picture, and 36 pantry items: 83 images. Paste the **style block** first, then one **line** per message. The file name in each heading is the slug the app expects.

## How to run it

1. Dishes: gemini.google.com, a new chat, the image tool. One prompt per message, in order. Download each image right after it is made.
2. Run `node scripts/name-recipe-images.mjs --dry`, then without `--dry`, so downloads are named in prompt order into `art-src/recipes/`; then `node scripts/prepare-recipe-images.mjs` (cuts out the white, 512px webp into `public/recipes/`).
3. Pantry items: put them in `art-src/ingredients/<slug>.jpeg`, then `node scripts/prepare-recipe-images.mjs ingredients` (256px into `public/ingredients/`).
4. Tell Claude "added" with the list of slugs, and it switches them on.

## Style block for dishes (paste before every dish line)
```
Flat vector food illustration, top-down view, one dish in a plain round bowl or plate, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, ingredients clearly recognizable and true to the dish, centered with space around it, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no cutlery, no extra props.
```

## Style block for pantry items (paste before every item line)
```
Flat vector food illustration, one ingredient or small group of the same ingredient, thin dark charcoal outline (about 2 px), bright friendly colors with flat fills and no gradients, a few simple highlight strokes, true to the real item, centered with space around it, slight three-quarter view, on a plain pure white background with no shadow and no floor, square 1:1 composition. No text, no logos, no hands, no people, no packaging brands.
```

## A. Dishes from the planned list (38)

### 1. buddha-bowl.jpeg
Buddha bowl

`bowl with rice, sweet potato, kale, chickpeas and avocado`

### 2. hummus-plate.jpeg
Hummus and pita

`bowl of hummus with olive oil, paprika and warm pita wedges`

### 3. falafel-wrap.jpeg
Falafel wrap

`wrap showing falafel, lettuce, tomato and tahini sauce`

### 4. chicken-shawarma-bowl.jpeg
Chicken shawarma bowl

`bowl of spiced chicken, rice, cucumber, tomato and white sauce`

### 5. chicken-stir-fry.jpeg
Chicken and veggie stir fry

`wok of chicken with broccoli, carrots and peppers in glossy sauce`

### 6. beef-broccoli.jpeg
Beef and broccoli

`plate of sliced beef and broccoli in dark sauce over rice`

### 7. kung-pao-chicken.jpeg
Kung pao chicken

`plate of chicken, peanuts and dried red chilies in glossy sauce`

### 8. sweet-sour-chicken.jpeg
Sweet and sour chicken

`plate of battered chicken with pineapple and peppers in red sauce`

### 9. veg-fried-rice.jpeg
Vegetable fried rice

`bowl of fried rice with carrot, peas, corn and spring onion`

### 10. chow-mein.jpeg
Veggie chow mein

`plate of stir-fried noodles with cabbage, carrot and peppers`

### 11. mapo-tofu.jpeg
Mapo tofu

`bowl of soft tofu cubes in red chili sauce with green onion`

### 12. dumplings.jpeg
Pan-fried dumplings

`plate of crisp-bottomed dumplings with dipping sauce`

### 13. ramen-egg.jpeg
Ramen with egg

`bowl of instant-style ramen with a halved soft egg, spring onion and nori`

### 14. chicken-teriyaki.jpeg
Chicken teriyaki

`glazed chicken over rice with sesame seeds and broccoli`

### 15. salmon-rice-bowl.jpeg
Salmon rice bowl

`bowl of rice with flaked salmon, cucumber, avocado and sesame`

### 16. katsu-curry.jpeg
Chicken katsu curry

`sliced crumbed chicken over rice with brown curry sauce`

### 17. miso-soup.jpeg
Miso soup with tofu

`bowl of miso soup with tofu cubes, seaweed and spring onion`

### 18. bibimbap.jpeg
Bibimbap

`bowl of rice with colored vegetable piles, beef, fried egg and red gochujang`

### 19. korean-fried-chicken.jpeg
Korean fried chicken

`crispy chicken pieces glazed with red sticky sauce and sesame`

### 20. kimchi-fried-rice.jpeg
Kimchi fried rice

`bowl of red-tinted fried rice topped with a fried egg and seaweed`

### 21. tteokbokki.jpeg
Tteokbokki

`bowl of chewy rice cakes in red spicy sauce with green onion`

### 22. pad-thai.jpeg
Pad Thai

`plate of noodles with shrimp, peanuts, bean sprouts and lime`

### 23. thai-green-curry.jpeg
Thai green curry

`bowl of pale green coconut curry with chicken and basil, with rice`

### 24. thai-basil-chicken.jpeg
Thai basil chicken

`plate of minced chicken and basil over rice with a fried egg`

### 25. veg-curry-coconut.jpeg
Coconut vegetable curry

`bowl of vegetables in yellow coconut curry over rice`

### 26. pho.jpeg
Chicken pho

`bowl of clear broth with rice noodles, chicken, herbs and lime`

### 27. banh-mi.jpeg
Banh mi sandwich

`baguette with meat, pickled carrot, cucumber and cilantro`

### 28. lentil-soup.jpeg
Lentil soup

`bowl of orange-brown lentil soup with lemon and parsley`

### 29. black-bean-soup.jpeg
Black bean soup

`bowl of dark bean soup with sour cream and cilantro`

### 30. broccoli-cheddar-soup.jpeg
Broccoli cheddar soup

`bowl of creamy soup with broccoli and shredded cheddar`

### 31. tofu-scramble.jpeg
Tofu scramble

`plate of yellow crumbled tofu with spinach and peppers beside toast`

### 32. chickpea-salad-sandwich.jpeg
Chickpea salad sandwich

`sandwich with mashed chickpea salad, lettuce and tomato`

### 33. sweet-potato-bowl.jpeg
Sweet potato and black bean bowl

`bowl of roasted sweet potato, black beans, avocado and lime`

### 34. tuna-salad.jpeg
Tuna salad bowl

`bowl of tuna with cucumber, tomato and greens`

### 35. egg-salad-sandwich.jpeg
Egg salad sandwich

`sandwich with chopped egg salad and lettuce, cut in half`

### 36. cottage-cheese-pancakes.jpeg
Cottage cheese pancakes

`stack of thin pancakes with berries and yogurt`

### 37. peanut-noodles.jpeg
Peanut noodles

`bowl of noodles in peanut sauce with cucumber, carrot and sesame`

### 38. ramen-veg.jpeg
Veggie ramen

`bowl of ramen with mushrooms, corn, spinach and nori`

## B. Dishes already in the app without a picture (9)

### 39. yogurt-banana.jpeg
Greek yogurt with banana

`bowl of thick Greek yogurt topped with sliced banana, a drizzle of honey and a few chopped nuts`

### 40. chana.jpeg
Roasted chana

`small bowl of roasted crunchy chickpeas dusted with cumin and chilli, with a lemon wedge`

### 41. pasta.jpeg
Tomato garlic pasta

`plate of penne pasta in a simple tomato sauce with basil leaves and grated cheese`

### 42. moong-chilla.jpeg
Moong dal chilla

`two golden savoury moong dal pancakes (chilla) stuffed with onion and coriander, folded on a plate`

### 43. egg-toast.jpeg
Egg bhurji on toast

`two slices of toast topped with fried eggs and cracked black pepper`

### 44. paneer-wrap.jpeg
Paneer wrap

`paneer tikka wrap cut in half on a plate, showing paneer cubes, onion and green chutney inside a roti`

### 45. smoothie.jpeg
Protein smoothie

`tall glass of a thick pink-purple berry and banana protein smoothie with a straw`

### 46. soy-pulao.jpeg
Soy chunk pulao

`bowl of fragrant vegetable pulao with soy chunks, peas and carrots, whole spices visible`

### 47. tofu-stir-fry.jpeg
Tofu stir fry with rice

`plate of crispy tofu cubes stir-fried with bell peppers and broccoli beside steamed rice`

## C. Pantry items (36)

### 48. onions.jpeg (folder: art-src/ingredients)
Onions

`two whole onions, one cut in half`

### 49. tomatoes.jpeg (folder: art-src/ingredients)
Tomatoes

`three ripe red tomatoes with a green stem`

### 50. potatoes.jpeg (folder: art-src/ingredients)
Potatoes

`three potatoes, one cut in half`

### 51. garlic.jpeg (folder: art-src/ingredients)
Garlic

`a whole garlic bulb with a few loose cloves`

### 52. ginger.jpeg (folder: art-src/ingredients)
Ginger

`a knob of fresh ginger root with one slice cut`

### 53. carrots.jpeg (folder: art-src/ingredients)
Carrots

`three orange carrots with leafy tops`

### 54. spinach.jpeg (folder: art-src/ingredients)
Spinach

`a bunch of fresh green spinach leaves`

### 55. cucumbers.jpeg (folder: art-src/ingredients)
Cucumbers

`two cucumbers, one sliced`

### 56. lemons.jpeg (folder: art-src/ingredients)
Lemons

`two lemons, one cut in half`

### 57. bananas.jpeg (folder: art-src/ingredients)
Bananas

`a bunch of three bananas`

### 58. green-chillies.jpeg (folder: art-src/ingredients)
Green chillies

`five green chillies`

### 59. coriander.jpeg (folder: art-src/ingredients)
Coriander

`a bunch of fresh coriander with roots`

### 60. cauliflower.jpeg (folder: art-src/ingredients)
Cauliflower

`a whole cauliflower head`

### 61. peas.jpeg (folder: art-src/ingredients)
Peas

`an open green pea pod with peas`

### 62. eggs.jpeg (folder: art-src/ingredients)
Eggs

`three eggs, one brown and two white`

### 63. milk.jpeg (folder: art-src/ingredients)
Milk

`a glass bottle of milk with a glass of milk beside it`

### 64. butter.jpeg (folder: art-src/ingredients)
Butter

`a block of butter with a slice cut off`

### 65. paneer.jpeg (folder: art-src/ingredients)
Paneer

`white paneer cubes in a small pile`

### 66. yogurt.jpeg (folder: art-src/ingredients)
Yogurt

`a small bowl of white yogurt`

### 67. cheese.jpeg (folder: art-src/ingredients)
Cheese

`a wedge of yellow cheese with a slice`

### 68. ghee.jpeg (folder: art-src/ingredients)
Ghee

`a small glass jar of golden ghee with a spoon`

### 69. rice.jpeg (folder: art-src/ingredients)
Rice

`a small cloth sack of rice with a pile of grains`

### 70. flour.jpeg (folder: art-src/ingredients)
Flour

`a paper bag of flour with a little pile spilling out`

### 71. toor-dal.jpeg (folder: art-src/ingredients)
Toor dal

`a small bowl of yellow toor dal lentils`

### 72. chickpeas.jpeg (folder: art-src/ingredients)
Chickpeas

`a small bowl of dry chickpeas`

### 73. rolled-oats.jpeg (folder: art-src/ingredients)
Rolled oats

`a small bowl of rolled oats`

### 74. pasta.jpeg (folder: art-src/ingredients)
Pasta

`a small pile of dry penne pasta`

### 75. bread.jpeg (folder: art-src/ingredients)
Bread

`a sliced loaf of bread`

### 76. oil.jpeg (folder: art-src/ingredients)
Oil

`a glass bottle of golden cooking oil`

### 77. salt.jpeg (folder: art-src/ingredients)
Salt

`a small bowl of white salt crystals`

### 78. black-pepper.jpeg (folder: art-src/ingredients)
Black pepper

`a small bowl of black peppercorns with a few spilling`

### 79. sugar.jpeg (folder: art-src/ingredients)
Sugar

`a small bowl of white sugar`

### 80. cumin-seeds.jpeg (folder: art-src/ingredients)
Cumin seeds

`a small bowl of cumin seeds`

### 81. turmeric.jpeg (folder: art-src/ingredients)
Turmeric

`a small bowl of bright yellow turmeric powder with a turmeric root`

### 82. garam-masala.jpeg (folder: art-src/ingredients)
Garam masala

`a small bowl of brown garam masala powder with whole cinnamon, cloves and cardamom beside it`

### 83. tea.jpeg (folder: art-src/ingredients)
Tea

`a small pile of loose black tea leaves with a tea bag`
