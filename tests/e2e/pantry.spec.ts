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

test("shows counts and groups", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
  await expect(page.getByText("9 items, 5 running low")).toBeVisible();
  await expect(page.getByRole("region", { name: "Produce" })).toBeVisible();
});

test("plus and minus change quantity, minus stops at 0", async ({ page }) => {
  await page.getByRole("button", { name: "More Garlic" }).click();
  await expect(page.getByText("9 cloves")).toBeVisible();
  const less = page.getByRole("button", { name: "Less Butter" });
  await less.click();
  await expect(page.getByText("0 packs")).toBeVisible();
});

test("running low filter and list toggle", async ({ page }) => {
  await page.getByRole("button", { name: /Running low/ }).click();
  await expect(page.getByRole("region", { name: "Dry goods" })).toBeVisible();
  await page.getByRole("button", { name: /running low/ }).first().click();
  await expect(page.getByText("On the list")).toBeVisible();
});

test("voice: hear, confirm, pantry updated", async ({ page }) => {
  await page.getByRole("button", { name: "Tell me what you have" }).click();
  await expect(page.getByText("I heard")).toBeVisible();
  await page.getByRole("button", { name: "Add to pantry" }).click();
  await expect(page.getByRole("status")).toHaveText("Pantry updated. I added 3 onions, 2 tomatoes and butter.");
  await expect(page.getByText("4 pcs")).toHaveCount(2); // onions 1+3, tomatoes 2+2
});
