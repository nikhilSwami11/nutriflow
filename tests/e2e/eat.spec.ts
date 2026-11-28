import { expect, test } from "@playwright/test";

test("write me something new: a best pick with its picture and one main action, wishes as chips, a nudge to set preferences", async ({ page }) => {
  await page.goto("/eat/new");
  const best = page.getByRole("article", { name: "Best pick" });
  await expect(best).toBeVisible();
  await expect(page.getByRole("button", { name: "Find" })).toHaveCount(0); // chips only

  // same rule as Home: cook when nothing blocks, else shop for what is missing
  const cook = best.getByRole("link", { name: "Start cooking" });
  const add = best.getByRole("button", { name: /^Add \d+ to shopping$/ });
  await expect(cook.or(add)).toBeVisible();
  if (await add.count()) {
    await expect(best.getByRole("link", { name: "Cook anyway" })).toHaveAttribute("href", /^\/cook\//);
    await add.click();
    await expect(best.getByRole("button", { name: /^\d+ on your shopping list$/ })).toBeDisabled();
  } else await expect(cook).toHaveAttribute("href", /^\/cook\//);

  await page.getByRole("button", { name: "Quick" }).click();
  await expect(page.getByRole("button", { name: "Quick" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Quick" }).click();
  await expect(page.getByRole("button", { name: "Quick" })).toHaveAttribute("aria-pressed", "false");

  await expect(page.getByRole("link", { name: "Set your diet and calories" })).toHaveAttribute("href", "/profile");
});

test("Suggested: picks with their reason, a way to My recipes, and a way to write something new", async ({ page }) => {
  await page.goto("/eat");
  await expect(page.getByRole("heading", { name: "Suggested", level: 1 })).toBeVisible();
  await expect(page.getByRole("article", { name: "Top pick" })).toBeVisible();
  await expect(page.getByRole("list", { name: "More suggestions" }).getByRole("link").first()).toBeVisible();
  await page.getByRole("button", { name: "Quick" }).click();
  await expect(page.getByRole("button", { name: "Quick" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "New recipes" })).toBeVisible();
  await page.getByRole("link", { name: "My recipes" }).click();
  await expect(page.getByRole("heading", { name: "Recipes", level: 1 })).toBeVisible();
});

test("Food and Kitchen switch between their pages", async ({ page }) => {
  await page.goto("/eat");
  const food = page.getByRole("navigation", { name: "Food" });
  await expect(food.getByRole("link", { name: "Suggested" })).toHaveAttribute("aria-current", "page");
  await expect(food.getByRole("link", { name: "Recipes" })).toHaveCount(0);
  await food.getByRole("link", { name: "Plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Plan", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Food" })).toHaveAttribute("aria-current", "page");


  await page.goto("/pantry");
  await page.getByRole("navigation", { name: "Kitchen" }).getByRole("link", { name: "Shopping" }).click();
  await expect(page).toHaveURL(/\/shopping$/);
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Kitchen" })).toHaveAttribute("aria-current", "page");
});
