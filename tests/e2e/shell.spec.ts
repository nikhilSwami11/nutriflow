import { expect, test } from "@playwright/test";

test("sidebar on desktop, bottom nav on mobile", async ({ page, isMobile }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Today" })).toHaveCount(isMobile ? 0 : 1);
  await expect(nav.getByRole("link", { name: "Home" })).toHaveCount(isMobile ? 1 : 0);
  if (!isMobile) {
    await expect(page.getByRole("heading", { name: "What are we cooking tonight?" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Plan" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Recipes" })).toBeVisible();
  }
});
