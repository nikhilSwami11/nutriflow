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
});

test("a new person answers a few illustrated questions once and gets a week and a cook plan", async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem("nutriflow.onboarded"));
  await page.goto("/");
  const sheet = page.getByRole("dialog", { name: "Set up NutriFlow" });
  await expect(sheet.getByRole("heading", { name: /Cook two days/ })).toBeVisible();
  await sheet.getByRole("button", { name: "Let's start" }).click();
  await sheet.getByLabel("Height (cm)").fill("170");
  await sheet.getByLabel("Weight (kg)").fill("70");
  await sheet.getByRole("button", { name: "Next" }).click();
  await sheet.getByRole("button", { name: /Build muscle/ }).click();
  await expect(sheet.getByText(/Your range: about/)).toBeVisible();
  await sheet.getByRole("button", { name: "Next" }).click();
  await sheet.getByRole("button", { name: "Vegetarian" }).click();
  await sheet.getByRole("button", { name: "Next" }).click();
  await sheet.getByRole("button", { name: "Eggs" }).click();
  await sheet.getByRole("button", { name: "Next" }).click();
  await expect(sheet.getByRole("heading", { name: "What is in your kitchen?" })).toBeVisible();
  await sheet.getByRole("group", { name: "Appliances" }).getByRole("button", { name: "Oven" }).click(); // no oven
  await sheet.getByRole("button", { name: "Build my week" }).click();
  await expect(sheet.getByRole("heading", { name: "Your week is ready" })).toBeVisible();
  await expect(sheet.getByText(/meals planned around/)).toBeVisible();
  await expect(sheet.getByText(/^Cook \d days?:/)).toBeVisible();
  await sheet.getByRole("button", { name: "Go to Today" }).click();
  await expect(sheet).toHaveCount(0);
  // Client-side navigation: the offline repositories live for one page load.
  await page.getByRole("link", { name: "Profile" }).first().click();
  await expect(page.getByRole("button", { name: "Vegetarian" })).toHaveAttribute("aria-pressed", "true");
});
