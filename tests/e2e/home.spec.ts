import { expect, test } from "@playwright/test";

const todayLine = (page: import("@playwright/test").Page) => page.getByRole("group", { name: "Today", exact: true });

test.beforeEach(async ({ page }) => {
  // Up next goes by the clock: pin noon so breakfast (eaten in the demo) has passed and lunch is next.
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);
  await page.clock.setSystemTime(noon);
  await page.goto("/");
});

test("home is three things: next meal, one chart with today, pantry", async ({ page }) => {
  await expect(page.getByRole("article", { name: "Up next" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Calories and macros" })).toBeVisible();
  await expect(todayLine(page)).toContainText("of 1,900 kcal");
  await expect(page.getByLabel("Pantry alert")).toBeVisible();
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

test("plan is in Food: nav, then the Plan switch", async ({ page }) => {
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Food" }).click();
  await page.getByRole("navigation", { name: "Food" }).getByRole("link", { name: "Plan" }).click();
  await expect(page.getByRole("heading", { name: "Plan", level: 1 })).toBeVisible();
});

test("pantry nudge adds running-low items to the list", async ({ page }) => {
  const btn = page.getByLabel("Pantry alert").getByRole("button", { name: /list/i });
  await expect(btn).toContainText("Add to list");
  await btn.click();
  await expect(btn).toContainText("On the list");
});

test("nav reaches the kitchen (pantry first)", async ({ page }) => {
  await page.getByRole("link", { name: "Kitchen" }).click();
  await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
});

test("feed posts can be liked and saved", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the feed is the mobile layout");
  const post = page.getByRole("article", { name: "Up next" });
  await post.getByRole("button", { name: "Like" }).click();
  await expect(post.getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "true");
  await post.getByRole("button", { name: "Save" }).click();
  await expect(post.getByRole("button", { name: "Save" })).toHaveAttribute("aria-pressed", "true");
  await post.getByRole("button", { name: "Like" }).click();
  await expect(post.getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "false");
});

const events = (page: import("@playwright/test").Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("nutriflow.feedEvents") ?? "[]") as { kind: string; action: string; position: number; dwellMs?: number }[]);

test("taps and likes are recorded as feed events", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the feed is the mobile layout");
  const post = page.getByRole("article", { name: "Up next" });
  await post.getByRole("button", { name: "Like" }).click();
  await post.getByRole("button", { name: "Mark eaten" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); // flushes the batch
  await expect.poll(async () => (await events(page)).map((e) => `${e.kind}:${e.action}`)).toEqual(expect.arrayContaining(["next-meal:like", "next-meal:mark-eaten"]));
});

test("a post that stays on screen records an impression with dwell time", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the feed is the mobile layout");
  await page.waitForTimeout(1500); // the first post is on screen for over a second
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await page.evaluate(() => document.querySelector(".rail")?.scrollTo(0, 9999)); // scroll it away: impression is sent when it leaves
  await page.waitForTimeout(300);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect.poll(async () => (await events(page)).filter((e) => e.action === "impression" && (e.dwellMs ?? 0) >= 1000).length).toBeGreaterThan(0);
});

test("past engagement reorders the feed on the next visit", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the feed is the mobile layout");
  const labels = () => page.locator("article[aria-label]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  await expect(page.getByRole("article", { name: "Pantry alert" })).toBeVisible();
  const before = await labels();
  expect(before.indexOf("Your day")).toBeLessThan(before.indexOf("Pantry alert"));
  const now = Date.now();
  await page.evaluate((t) => {
    const e = Array.from({ length: 12 }, (_, i) => ({ itemId: "pantry-alert:x", kind: "pantry-alert", action: i % 2 ? "add-to-list" : "open", position: 2, ts: t - i * 1000 }));
    localStorage.setItem("nutriflow.feedEvents", JSON.stringify(e));
  }, now);
  await page.reload();
  await expect(page.getByRole("article", { name: "Pantry alert" })).toBeVisible();
  const after = await labels();
  expect(after.indexOf("Pantry alert")).toBeLessThan(after.indexOf("Your day"));
  expect(after[0]).toBe("Up next"); // the next meal stays on top
});

test("desktop dashboard records the same events and follows the same feed", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop layout");
  await page.getByRole("article", { name: "Up next" }).getByRole("button", { name: "Mark eaten" }).click();
  await page.getByLabel("Pantry alert").getByRole("button", { name: /list/i }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect.poll(async () => (await events(page)).map((e) => `${e.kind}:${e.action}`)).toEqual(expect.arrayContaining(["next-meal:mark-eaten", "pantry-alert:add-to-list"]));
  // card order follows the feed: next meal first
  const labels = await page.locator("article[aria-label], section[aria-label]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(labels.indexOf("Up next")).toBeLessThan(labels.indexOf("Calories and macros"));
});

test("Up next says what is missing and puts it on the shopping list in one tap", async ({ page }) => {
  // Lunch (a complete chana masala) needs things the demo pantry lacks.
  const add = page.getByRole("button", { name: /^Add \d+ to shopping$/ });
  await expect(add).toBeVisible();
  const n = (await add.textContent())!.match(/\d+/)![0];
  await add.click();
  await expect(page.getByRole("link", { name: `${n} on your shopping list · View` })).toBeVisible();
});
