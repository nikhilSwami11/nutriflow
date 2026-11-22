import { expect, test } from "@playwright/test";

test("ask what to eat: a best pick with one tap to cook, wishes as chips, a nudge to set preferences", async ({ page }) => {
  await page.goto("/eat");
  const best = page.getByRole("article", { name: "Best pick" });
  await expect(best).toBeVisible();
  await expect(best.getByRole("link", { name: "Start cooking" })).toHaveAttribute("href", /^\/cook\//);

  // typed words become chips
  await page.getByLabel("Tell me what you feel like").fill("something quick and light");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.getByRole("button", { name: "Quick" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Light" }).click();
  await expect(page.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "false");

  // no profile saved yet
  await expect(page.getByRole("link", { name: "Set your diet and calories" })).toHaveAttribute("href", "/profile");
});
