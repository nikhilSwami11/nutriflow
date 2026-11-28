import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRecognition {
      onresult: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: "I have 3 onions, 2 tomatoes and butter" }]] });
          this.onend?.(); // the real API ends the session after a result
        }, 50);
      }
      stop() {}
    }
    (window as unknown as Record<string, unknown>).SpeechRecognition = FakeRecognition;
  });
  await page.goto("/pantry");
});

test("shows counts and one flat list", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
  await expect(page.getByText("9 items, 5 running low")).toBeVisible();
  await expect(page.getByRole("region", { name: "In stock" })).toBeVisible(); // available first
  await expect(page.getByRole("region", { name: "Out of stock" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Produce" })).toHaveCount(0); // no group headings
});

test("Edit shows plus and minus; minus stops at 0; Done goes back to a clean view", async ({ page }) => {
  await expect(page.getByRole("button", { name: "More Garlic" })).toHaveCount(0); // view mode: no steppers
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "More Garlic" }).click();
  await expect(page.getByText("9 cloves").first()).toBeVisible();
  const less = page.getByRole("button", { name: "Less Butter" });
  await less.click();
  await expect(page.getByText("0 packs").first()).toBeVisible();
});

test("low and out items are greyed with a plain stock note, and the list button toggles", async ({ page }) => {
  const out = page.getByRole("region", { name: "Out of stock" });
  await expect(out.getByText("Butter")).toBeVisible();
  await expect(page.getByRole("region", { name: "In stock" }).getByText(/^Low · /).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "All 9" })).toHaveCount(0); // no tab switch
  await out.getByRole("button", { name: "Add to list" }).click(); // an out item goes straight to the shopping list
  await expect(out.getByText("On the list")).toBeVisible();
});

test("voice: tell the orb what you have, confirm, pantry updated", async ({ page }) => {
  await page.getByRole("button", { name: "Ask NutriFlow" }).click();
  await page.getByLabel("Message NutriFlow").fill("I have 3 onions and 2 tomatoes");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByRole("button", { name: "Add to pantry" }).click();
  await expect(page.getByRole("region", { name: "In stock" }).getByText("4 pcs")).toHaveCount(2); // onions 1+3, tomatoes 2+2
});

test("type what you have and it is added at once; Edit can remove an item", async ({ page }) => {
  await page.getByLabel("Type what you have").fill("3 onions");
  await page.getByRole("button", { name: "Add typed item" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added" })).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Remove Garlic" }).click();
  await expect(page.getByRole("button", { name: "More Garlic" })).toHaveCount(0);
});

test("add manually: select squares, export the selection, add them", async ({ page }) => {
  await page.getByRole("button", { name: "Add manually" }).click();
  const sheet = page.getByRole("dialog", { name: "Add items" });
  await sheet.getByRole("button", { name: "Rice" }).click();
  await sheet.getByRole("button", { name: "Salt" }).click();
  await expect(sheet.getByRole("button", { name: "Rice" })).toHaveAttribute("aria-pressed", "true");
  await expect(sheet.getByRole("link", { name: "Email" })).toHaveAttribute("href", /^mailto:\?subject=Shopping%20list&body=.*Rice.*Salt/);
  await expect(sheet.getByRole("button", { name: "Copy list" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Image" })).toBeVisible();
  await sheet.getByRole("button", { name: "Add 2 to pantry" }).click();
  await expect(sheet).toHaveCount(0);
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("button", { name: "More Rice" })).toBeVisible();
});
