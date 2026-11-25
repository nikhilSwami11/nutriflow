import { expect, test } from "@playwright/test";

test("Recipes holds only saved recipes: empty at first, then what you save, with filters and search", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { name: "Recipes", level: 1 })).toBeVisible();
  await expect(page.getByText("Your saved recipes live here")).toBeVisible();
  await expect(page.getByRole("link", { name: "What should I eat?" })).toHaveAttribute("href", "/eat");

  // save one (client navigation keeps the in-memory data)
  await page.goto("/recipes/dal-tadka");
  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("button", { name: "Save recipe" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("navigation", { name: "Food" }).getByRole("link", { name: "Recipes" }).click();
  await expect(page.getByRole("link", { name: "Dal tadka" })).toBeVisible();
  await expect(page.getByText(/\d+ ready to cook/)).toBeVisible();
  await page.getByRole("textbox", { name: "Search recipes" }).fill("omelette");
  await expect(page.getByText("No recipes match.")).toBeVisible();
  await page.getByRole("textbox", { name: "Search recipes" }).fill("dal");
  await expect(page.locator('a[href^="/recipes/"]')).toHaveCount(1);
});

test("recipe detail: pantry status, servings, missing items, steps", async ({ page }) => {
  await page.goto("/recipes/dal-tadka");
  await expect(page.getByRole("heading", { name: "Dal tadka", level: 1 })).toBeVisible();
  await expect(page.getByText("In pantry").first()).toBeVisible(); // seeded pantry has toor dal, onions, tomatoes
  await expect(page.getByText("Fresh coriander")).toBeVisible();
  const row = page.locator("div", { hasText: /^Toor dal/ }).last();
  await expect(row).toContainText("1 cup");
  await page.getByRole("button", { name: "Fewer servings" }).click();
  await page.getByRole("button", { name: "Fewer servings" }).click();
  await expect(page.getByText("2 servings")).toBeVisible();
  await expect(row).toContainText("½ cup");
  const add = page.getByRole("button", { name: /missing item/ });
  await add.click();
  await expect(add).toContainText("on your list");
  await expect(page.getByText("Simmer").first()).toBeVisible();
});

test("unknown recipe shows the not-found page, not a crash", async ({ page }) => {
  await page.goto("/recipes/nope");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});

test("edit a recipe by hand: a built-in becomes your own saved copy", async ({ page }) => {
  await page.goto("/recipes/dal-tadka");
  await expect(page.getByRole("button", { name: "Ask AI" })).toHaveCount(0); // needs the account
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit recipe" });
  await dialog.getByLabel("Name").fill("Dal tadka, my way");
  await dialog.getByRole("button", { name: "Remove step 1" }).click();
  await dialog.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("heading", { name: "Dal tadka, my way", level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/recipes\/ai-/);
  await expect(page.getByRole("button", { name: "Save recipe" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("navigation", { name: "Food" }).getByRole("link", { name: "Recipes" }).click();
  await expect(page.getByRole("link", { name: "Dal tadka, my way" })).toBeVisible();
});
