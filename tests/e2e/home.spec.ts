import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("home shows today, trend, up next and pantry alert", async ({ page }) => {
  await expect(page.getByRole("region", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Trend" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Up next" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Pantry alert" })).toBeVisible();
});

test("trend leaves unlogged days as gaps", async ({ page }) => {
  // seed leaves two days unlogged, so the chart has more than one line segment
  const trend = page.getByRole("img", { name: /Calories, last 7 days/ });
  await expect(trend.locator('path[stroke="#7FC8A4"]')).not.toHaveCount(0);
  await expect(trend.locator('path[fill="#BFE5D2"]')).toHaveCount(await trend.locator('path[stroke="#7FC8A4"]').count());
});

test("buy tile adds running-low items to the list", async ({ page }) => {
  const tile = page.getByRole("button", { name: /^Buy / });
  await expect(tile).toContainText("Add to list");
  await tile.click();
  await expect(tile).toContainText("On the list");
});

test("nav reaches pantry", async ({ page }) => {
  await page.getByRole("link", { name: "Pantry" }).click();
  await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
});
