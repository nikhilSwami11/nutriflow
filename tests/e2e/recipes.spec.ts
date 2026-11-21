import { expect, test } from "@playwright/test";

test("recipes list filters and searches", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { name: "Recipes", level: 1 })).toBeVisible();
  await expect(page.getByText("you can cook right now")).toBeVisible();
  const all = await page.locator('a[href^="/recipes/"]').count();
  await page.getByRole("button", { name: "Under 30 min" }).click();
  const quick = await page.locator('a[href^="/recipes/"]').count();
  expect(quick).toBeGreaterThan(0);
  expect(quick).toBeLessThan(all);
  await page.getByRole("button", { name: "All" }).click();
  await page.getByRole("textbox", { name: "Search recipes" }).fill("dal tadka");
  await expect(page.getByRole("link", { name: "Dal tadka" })).toBeVisible();
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
