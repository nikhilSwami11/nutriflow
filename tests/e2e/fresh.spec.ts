import { expect, test } from "@playwright/test";

// A brand-new account: no pantry, chores, logs or history. No demo numbers may show.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nutriflow.fresh", "1"));
  await page.clock.setSystemTime(new Date(2026, 10, 23, 12, 0));
});

test("home shows a first day, not sample history", async ({ page, isMobile }) => {
  test.skip(isMobile, "the chart is in the feed on the phone");
  await page.goto("/");
  await expect(page.getByText("Your first day")).toBeVisible();
  await expect(page.getByRole("group", { name: "Today" })).toContainText("0");
});

test("pantry and shopping say where to start", async ({ page }) => {
  await page.goto("/pantry");
  await expect(page.getByText("Your pantry is empty")).toBeVisible();
  await page.goto("/shopping");
  await expect(page.getByText("Start with your pantry")).toBeVisible();
  await expect(page.getByRole("list")).toHaveCount(0);
});

test("plan does not claim a history", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByText("Picked to fit your diet")).toBeVisible();
});
