import { expect, test } from "@playwright/test";

// Supabase is blanked in e2e, so Google cannot work here: the screen must say so instead of hanging.
test("sign-in screen offers Google and Not now", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: "Welcome to NutriFlow" })).toBeVisible();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByText("Could not sign in. Try again.")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page).toHaveURL("/");
});
