import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/plan");
});

test("plan shows a week of meals, goals and notes", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Plan", level: 1 })).toBeVisible();
  await expect(page.getByText("aiming at 1,900 kcal and 105 g protein a day")).toBeVisible();
  // today is open; the other six days are one tap away, not all on screen at once
  await expect(page.getByRole("tab")).toHaveCount(7);
  await expect(page.getByRole("tab", { name: /Today/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('section[aria-label$=" plan"]')).toHaveCount(1);
  await expect(page.getByRole("tabpanel")).toContainText("Today");
  await expect(page.getByRole("region", { name: "Week balance" })).toContainText("Average protein");
  await expect(page.getByRole("list", { name: "Notes" }).getByRole("listitem")).not.toHaveCount(0);
});

test("high protein focus does not lower average protein", async ({ page }) => {
  const read = async () => Number(((await page.getByRole("region", { name: "Week balance" }).textContent()) ?? "").match(/Average protein(\d+) g/)![1]);
  const before = await read();
  await page.getByRole("button", { name: "High protein" }).click();
  await expect.poll(read).toBeGreaterThanOrEqual(before);
});

test("a planned meal opens its recipe", async ({ page }) => {
  await page.locator('section[aria-label="Today plan"] a[href^="/recipes/"]').first().click();
  await expect(page).toHaveURL(/\/recipes\//);
});

test("tapping another day opens just that day", async ({ page }) => {
  await page.getByRole("tab").nth(2).click();
  await expect(page.getByRole("tab").nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('section[aria-label$=" plan"]')).toHaveCount(1);
  await expect(page.getByRole("tabpanel")).not.toContainText("Today");
  await expect(page.getByRole("tabpanel").getByRole("link")).toHaveCount(4); // breakfast, lunch, snack, dinner
});

test("day strip works with arrow keys", async ({ page }) => {
  await page.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab").nth(6)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
});
