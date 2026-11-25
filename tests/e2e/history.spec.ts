import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setSystemTime(new Date(2026, 10, 24, 12, 0));
});

test("history shows the month as a calendar with the picked day's meals", async ({ page }) => {
  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await expect(page.getByRole("group", { name: "November 2026" })).toBeVisible();
  // Today is open by default.
  await expect(page.getByRole("button", { pressed: true })).toHaveAttribute("aria-current", "date");
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.getByRole("group", { name: "October 2026" })).toBeVisible();
  // The future is not browsable.
  await expect(page.getByRole("button", { name: "Next month" })).toBeEnabled();
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.getByRole("button", { name: "Next month" })).toBeDisabled();
});

test("a new account sees where the history will start", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nutriflow.fresh", "1"));
  await page.goto("/history");
  await expect(page.getByText(/Your history starts with your first meal/)).toBeVisible();
});
