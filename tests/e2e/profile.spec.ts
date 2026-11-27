import { expect, test } from "@playwright/test";

test("profile: guest account with Google, pick a diet, set calories and dislikes, save", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "You are using a guest account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();

  await page.getByRole("button", { name: "Vegetarian" }).click();
  await expect(page.getByRole("button", { name: "Vegetarian" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Custom" }).click();
  await page.getByLabel("Calories from").fill("1600");
  await page.getByLabel("Calories to").fill("1900");
  await page.getByLabel("Foods to skip").fill("Mushrooms, peanuts");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved");

  // a range that cannot work is refused
  await page.getByLabel("Calories to").fill("1500");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/^Could not save/)).toBeVisible();
});

test("profile: connector link and steps for Claude and ChatGPT", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Use with Claude or ChatGPT" })).toBeVisible();
  await expect(page.getByLabel("Connector link")).toHaveValue(/\/mcp$/);
  await expect(page.getByText("Claude is not connected yet")).toBeVisible();
  await expect(page.getByText("Choose Add custom connector and paste the link.")).toBeVisible();
  await page.getByRole("button", { name: "ChatGPT" }).click();
  await expect(page.getByRole("button", { name: "ChatGPT" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/turn on Developer mode/)).toBeVisible();
});
