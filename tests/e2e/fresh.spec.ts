import { expect, test } from "@playwright/test";

// A brand-new account: no pantry, chores, logs or history. No demo numbers may show.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nutriflow.fresh", "1"));
  // The first-run questions have their own test; the others are about an empty account, not the questions.
  await page.addInitScript(() => localStorage.setItem("nutriflow.onboarded", "1"));
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

test("an empty pantry asks what you have instead of saying everything is missing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/You are missing/)).toHaveCount(0);
  await expect(page.getByText("Check as you cook").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Start cooking" }).first()).toBeVisible();
  await page.getByRole("button", { name: "More" }).first().click();
  await page.getByRole("button", { name: "Check what I have" }).first().click();
  const sheet = page.getByRole("dialog", { name: "Do you have these?" });
  await expect(sheet).toBeVisible();
  const first = sheet.getByRole("button", { name: /^I have / }).first();
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
});

test("a new person is asked three questions once, and the answers are kept", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("nutriflow.onboarded"));
  await page.goto("/");
  const sheet = page.getByRole("dialog", { name: "A few questions" });
  await expect(sheet.getByRole("heading", { name: "How do you eat?" })).toBeVisible();
  await sheet.getByRole("button", { name: "Vegetarian" }).click();
  await sheet.getByRole("button", { name: "Next" }).click();
  await sheet.getByRole("button", { name: /Build muscle/ }).click();
  await sheet.getByRole("button", { name: "Next" }).click();
  await sheet.getByRole("button", { name: "Eggs" }).click();
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toHaveCount(0);
  // Client-side navigation: the offline repositories live for one page load.
  await page.getByRole("link", { name: "Profile" }).first().click();
  await expect(page.getByRole("button", { name: "Vegetarian" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Build muscle" })).toHaveAttribute("aria-pressed", "true"); // 2,200 to 2,600
  await page.getByRole("link", { name: "Kitchen" }).first().click();
  await expect(page.getByText("eggs", { exact: false }).first()).toBeVisible();
});

test("don't have: offers a stand-in first, and shopping only if asked", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "More" }).first().click();
  await page.getByRole("button", { name: "Check what I have" }).first().click();
  const sheet = page.getByRole("dialog", { name: "Do you have these?" });
  const nos = sheet.getByRole("button", { name: /^Don't have / });
  const n = await nos.count();
  for (let i = 0; i < n; i++) await nos.nth(i).click();
  await expect(sheet.getByText("Instead:").first()).toBeVisible();
  const use = sheet.getByRole("button", { name: "I'll use that" });
  while (await use.count()) await use.first().click();
  await expect(sheet.getByRole("button", { name: /Done · .*stand-in/ })).toBeVisible();
});
