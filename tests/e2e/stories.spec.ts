import { expect, test } from "@playwright/test";

const story = (page: import("@playwright/test").Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label} story`) });
const dialog = (page: import("@playwright/test").Page) => page.getByRole("dialog");

test.describe("with reduced motion (nothing advances on its own)", () => {
  test.use({ reducedMotion: "reduce" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(story(page, "Lunch")).toBeVisible();
  });

  test("the row has today's meals and the pantry, with the eaten one marked", async ({ page }) => {
    for (const l of ["Breakfast", "Lunch", "Snack", "Dinner", "Pantry"]) await expect(story(page, l)).toBeVisible();
    await expect(story(page, "Breakfast")).toHaveAccessibleName("Breakfast story, eaten");
    await expect(story(page, "Lunch")).toHaveAccessibleName("Lunch story, new");
  });

  test("opening a meal story shows the recipe and its actions; Escape closes and returns focus", async ({ page }) => {
    await story(page, "Lunch").click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toContainText("Cook");
    await expect(dialog(page).getByRole("link", { name: "Open recipe" })).toHaveAttribute("href", /\/recipes\//);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(story(page, "Lunch")).toBeFocused();
    await expect(story(page, "Lunch")).toHaveAccessibleName("Lunch story, seen");
  });

  test("marking eaten inside a story updates the ring and the page", async ({ page }) => {
    await story(page, "Lunch").click();
    await dialog(page).getByRole("button", { name: "Mark eaten" }).click();
    await expect(dialog(page).getByRole("button", { name: "Undo eaten" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(story(page, "Lunch")).toHaveAccessibleName("Lunch story, eaten");
    await expect(page.getByRole("article", { name: "Up next" })).toContainText("Snack"); // the feed moved on
  });

  test("arrow keys and tap zones move between stories; the last one closes", async ({ page }) => {
    await story(page, "Breakfast").click();
    await expect(dialog(page)).toHaveAccessibleName("Breakfast story");
    await page.keyboard.press("ArrowRight");
    await expect(dialog(page)).toHaveAccessibleName("Lunch story");
    await page.keyboard.press("ArrowLeft");
    await expect(dialog(page)).toHaveAccessibleName("Breakfast story");
    for (let i = 0; i < 12 && (await dialog(page).count()); i++) await page.keyboard.press("ArrowRight");
    await expect(dialog(page)).toHaveCount(0);
  });

  test("seen stories stay seen after a reload, and opens are recorded as story events", async ({ page }) => {
    await story(page, "Pantry").click();
    await dialog(page).getByRole("button", { name: /list/i }).click();
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    const evs = await page.evaluate(() => JSON.parse(localStorage.getItem("nutriflow.feedEvents") ?? "[]") as { kind: string; action: string }[]);
    expect(evs.map((e) => `${e.kind}:${e.action}`)).toEqual(expect.arrayContaining(["story:open", "story:add-to-list"]));
    await page.reload();
    await expect(story(page, "Pantry")).toHaveAccessibleName("Pantry story, seen");
  });
});

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("a story advances by itself and pauses while the pointer is held", async ({ page, isMobile }) => {
    test.setTimeout(30_000);
    await page.goto("/");
    // a real finger taps; a mobile "click" would also send a mouse hover, which pauses the story
    if (isMobile) await story(page, "Breakfast").tap();
    else await story(page, "Breakfast").click();
    await expect(dialog(page)).toHaveAccessibleName("Breakfast story");
    if (!isMobile) {
      // hovering pauses: after well over one slide duration it is still on the same slide
      await page.mouse.move(await dialog(page).evaluate((e) => e.getBoundingClientRect().x + 100), 400);
      await page.waitForTimeout(7500);
      await expect(dialog(page)).toHaveAccessibleName("Breakfast story");
      await page.mouse.move(2, 2);
    }
    await expect(dialog(page)).toHaveAccessibleName("Lunch story", { timeout: 9000 });
  });
});
