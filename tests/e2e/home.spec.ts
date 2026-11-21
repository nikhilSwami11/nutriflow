import { expect, test } from "@playwright/test";

const todayLine = (page: import("@playwright/test").Page) => page.getByRole("group", { name: "Today", exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("home is three things: next meal, one chart with today, pantry", async ({ page }) => {
  await expect(page.getByRole("article", { name: "Up next" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Calories and macros" })).toBeVisible();
  await expect(todayLine(page)).toContainText("of 1,900 kcal");
  await expect(page.getByRole("region", { name: "Pantry alert" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Up next" }).getByText("Then")).toBeVisible();
});

test("tapping the next meal opens its recipe", async ({ page }) => {
  const hero = page.getByRole("article", { name: "Up next" });
  await expect(hero).toContainText("Up next · Lunch");
  await hero.getByRole("link").first().click(); // the recipe card; the rest are the "Then" links
  await expect(page).toHaveURL(/\/recipes\/[a-z-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("marking a meal eaten moves on and updates today", async ({ page }) => {
  const hero = page.getByRole("article", { name: "Up next" });
  const left = todayLine(page).getByText(/[\d,]+ left/);
  await expect(left).toBeVisible();
  const before = await left.textContent();
  await hero.getByRole("button", { name: "Mark eaten" }).click();
  await expect(hero).toContainText("Up next · Snack");
  await expect(left).not.toHaveText(before!); // eating lunch uses up part of the day
  await hero.getByRole("button", { name: "Mark eaten" }).click();
  await expect(hero).toContainText("Up next · Dinner");
  await expect(hero.getByText("Then")).toHaveCount(0); // nothing left after dinner
  await hero.getByRole("button", { name: "Mark eaten" }).click();
  await expect(page.getByText("All meals eaten for today")).toBeVisible();
});

test("range tabs switch the chart between 7 and 30 days", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Calories and macros, last 7 days" })).toBeVisible();
  await page.getByRole("button", { name: "30 days" }).click();
  await expect(page.getByRole("heading", { name: "Calories and macros, last 30 days" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Day" })).toHaveAttribute("aria-valuemax", "29");
});

test("hovering anywhere along the chart snaps to the nearest day", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover is a desktop interaction");
  const slider = page.getByRole("slider", { name: "Day" });
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  const status = page.getByRole("status");
  await expect(status).toHaveText("");
  await page.mouse.move(box.x + box.width * 0.55, box.y + 20);
  await expect(status).toHaveText(/eaten [\d,]+ kcal, planned [\d,]+ kcal/);
  const first = await status.textContent();
  await page.mouse.move(box.x + box.width * 0.9, box.y + 20);
  await expect(status).not.toHaveText(first!);
  await page.mouse.move(box.x - 60, box.y + 20);
  await expect(status).toHaveText("");
});

test("chart is keyboard operable", async ({ page }) => {
  const slider = page.getByRole("slider", { name: "Day" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "1");
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "6");
});

test("tapping the chart on touch jumps to that day", async ({ page, isMobile }) => {
  test.skip(!isMobile, "touch only");
  const slider = page.getByRole("slider", { name: "Day" });
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width - 12, box.y + box.height / 2);
  await expect(slider).toHaveAttribute("aria-valuenow", "6");
  await expect(page.getByRole("status")).toContainText("Today");
});

test("plan link opens the plan", async ({ page }) => {
  await page.getByRole("link", { name: "Plan the week" }).click();
  await expect(page.getByRole("heading", { name: "Plan", level: 1 })).toBeVisible();
});

test("pantry nudge adds running-low items to the list", async ({ page }) => {
  const btn = page.getByRole("region", { name: "Pantry alert" }).getByRole("button");
  await expect(btn).toContainText("Add to list");
  await btn.click();
  await expect(btn).toContainText("On the list");
});

test("nav reaches pantry", async ({ page }) => {
  await page.getByRole("link", { name: "Pantry" }).click();
  await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
});
