import { expect, test } from "@playwright/test";

// Supabase is blanked in e2e, so Google cannot work here: the screen must say so instead of hanging.
test("sign-in screen offers Google and Not now", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: "Your next meal, already figured out." })).toBeVisible();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByText("Could not sign in. Try again.")).toBeVisible();
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page).toHaveURL("/");
});

// Supabase is blanked in e2e, so email cannot work here either: the form must open and say so.
test("sign-in screen offers email", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Use email instead" }).click();
  await page.getByLabel("Email").fill("a@b.co");
  await page.getByLabel("Password").fill("secret1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Could not sign in. Try again.")).toBeVisible();
});
