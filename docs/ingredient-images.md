# Ingredient pictures (pantry squares)

The pantry and the Add items sheet show a coloured square with the first letter until an item has a picture. To add pictures:

1. Generate each image in the same style as the recipe art (hand-drawn sticker look, thin dark outline, rich colour), the single item centred on a plain white background.
2. Save as `art-src/ingredients/<slug>.jpeg` (slug below). `art-src/` is git-ignored.
3. Run `node scripts/prepare-recipe-images.mjs ingredients` (cuts the white out, 256px webp into `public/ingredients/`).
4. Add the slug to `WITH_IMAGE` in `src/domain/pantry/catalog.ts`. Items with a picture are suggested first.

Prompt template: `A single {item}, hand-drawn sticker illustration, thin dark outline, rich saturated colours, small detail, centred, plain white background, no shadow, no text.`

| Item | Slug |
|---|---|
| Onions | `onions` |
| Tomatoes | `tomatoes` |
| Potatoes | `potatoes` |
| Garlic | `garlic` |
| Ginger | `ginger` |
| Carrots | `carrots` |
| Spinach | `spinach` |
| Cucumbers | `cucumbers` |
| Lemons | `lemons` |
| Bananas | `bananas` |
| Green chillies | `green-chillies` |
| Coriander | `coriander` |
| Cauliflower | `cauliflower` |
| Peas | `peas` |
| Eggs | `eggs` |
| Milk | `milk` |
| Butter | `butter` |
| Paneer | `paneer` |
| Yogurt | `yogurt` |
| Cheese | `cheese` |
| Ghee | `ghee` |
| Rice | `rice` |
| Flour | `flour` |
| Toor dal | `toor-dal` |
| Chickpeas | `chickpeas` |
| Rolled oats | `rolled-oats` |
| Pasta | `pasta` |
| Bread | `bread` |
| Oil | `oil` |
| Salt | `salt` |
| Black pepper | `black-pepper` |
| Sugar | `sugar` |
| Cumin seeds | `cumin-seeds` |
| Turmeric | `turmeric` |
| Garam masala | `garam-masala` |
| Tea | `tea` |
