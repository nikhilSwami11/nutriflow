import { expect, test } from "@playwright/test";

test("cmd+K finds a screen by a word and opens it", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut is a desktop feature");
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Go to/ })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  const box = page.getByRole("combobox", { name: "Go to a screen" });
  await expect(box).toBeFocused();
  await box.fill("groceries");
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(page.getByRole("option", { name: "Shopping" })).toBeVisible();
  await box.press("Enter");
  await expect(page).toHaveURL(/\/shopping$/);
});

test("escape closes it and arrows move the choice", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut is a desktop feature");
  await page.goto("/");
  await page.getByRole("button", { name: /Go to/ }).click();
  const box = page.getByRole("combobox", { name: "Go to a screen" });
  await box.press("ArrowDown");
  await expect(page.getByRole("option", { selected: true })).toHaveAccessibleName("What to eat");
  await box.press("Escape");
  await expect(box).toHaveCount(0);
});
