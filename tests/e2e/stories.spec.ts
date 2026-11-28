import { expect, test } from "@playwright/test";

const story = (page: import("@playwright/test").Page, label: string) => page.getByRole("button", { name: new RegExp(`^${label} story`) });
const dialog = (page: import("@playwright/test").Page) => page.getByRole("dialog");
// Up next goes by the clock: pin it to noon so breakfast (eaten in the demo) has passed and lunch is next.
const noon = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
test.beforeEach(async ({ page }) => { await page.clock.setSystemTime(noon()); });
test.describe("with reduced motion (nothing advances on its own)", () => {
  test.use({ reducedMotion: "reduce" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(story(page, "Prep")).toBeVisible();
  });

  test("no Eat next story while meals are still ahead today (the Up next card says it), no meal names in the row", async ({ page }) => {
    for (const l of ["Prep", "Pantry"]) await expect(story(page, l)).toBeVisible();
    for (const l of ["Breakfast", "Lunch", "Snack", "Dinner"]) await expect(story(page, l)).toHaveCount(0);
    await expect(story(page, "Prep")).toHaveAccessibleName("Prep story, new");
  });

  test("a story opens as a dialog; Escape closes it and returns focus", async ({ page }) => {
    await story(page, "Prep").click();
    await expect(dialog(page)).toHaveAccessibleName("Prep story");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(story(page, "Prep")).toBeFocused();
    await expect(story(page, "Prep")).toHaveAccessibleName("Prep story, seen");
  });

  test("marking eaten on the card moves Up next on to the following meal", async ({ page }) => {
    const card = page.getByRole("article", { name: "Up next" });
    await expect(card).toContainText("Lunch");
    await card.getByRole("button", { name: "More" }).click();
    await card.getByRole("button", { name: "Mark eaten" }).click();
    await expect(page.getByRole("article", { name: "Up next" })).toContainText("Snack");
  });

  test("prep ahead: tick a job, it stays ticked after a reload", async ({ page }) => {
    await story(page, "Prep").click();
    const job = dialog(page).getByRole("listitem").getByRole("button").first();
    await expect(job).toHaveAttribute("aria-pressed", "false");
    await job.click();
    await expect(job).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await story(page, "Prep").click();
    await expect(dialog(page).getByRole("listitem").getByRole("button").first()).toHaveAttribute("aria-pressed", "true");
  });

  test("a chore story: start holds it in progress, mark complete ticks it everywhere, undo", async ({ page }) => {
    const chore = story(page, "Dishes after dinner");
    await expect(chore).toHaveAccessibleName("Dishes after dinner story, new");
    await chore.click();
    await expect(dialog(page)).toHaveAccessibleName("Dishes after dinner story");
    await dialog(page).getByRole("button", { name: "Start doing" }).click();
    await expect(dialog(page)).toContainText("In progress");
    await expect(dialog(page).getByRole("button", { name: "Start doing" })).toHaveCount(0);
    await dialog(page).getByRole("button", { name: "Mark complete" }).click();
    await expect(dialog(page).getByRole("button", { name: "Undo" })).toBeVisible();
    await dialog(page).getByRole("button", { name: "Undo" }).click();
    await expect(dialog(page).getByRole("button", { name: "Mark complete" })).toBeVisible();
    await dialog(page).getByRole("button", { name: "Mark complete" }).click();
    await page.keyboard.press("Escape");
    await expect(chore).toHaveAccessibleName("Dishes after dinner story, done");
    // same repository: the Chores screen shows it done (client navigation keeps the in-memory data)
    await page.getByRole("link", { name: "Chores" }).first().click();
    await expect(page.getByRole("region", { name: "Done" }).getByRole("button", { name: "Dishes after dinner, done" })).toBeVisible();
  });

  test("arrow keys and tap zones move between stories; the last one closes", async ({ page }) => {
    await story(page, "Prep").click();
    await expect(dialog(page)).toHaveAccessibleName("Prep story");
    await page.keyboard.press("ArrowRight");
    await expect(dialog(page)).not.toHaveAccessibleName("Prep story");
    await page.keyboard.press("ArrowLeft");
    await expect(dialog(page)).toHaveAccessibleName("Prep story");
    for (let i = 0; i < 20 && (await dialog(page).count()); i++) await page.keyboard.press("ArrowRight");
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
    if (isMobile) await story(page, "Prep").tap();
    else await story(page, "Prep").click();
    await expect(dialog(page)).toHaveAccessibleName("Prep story");
    if (!isMobile) {
      // hovering pauses: after well over one slide duration it is still on the same slide
      await page.mouse.move(await dialog(page).evaluate((e) => e.getBoundingClientRect().x + 100), 400);
      await page.waitForTimeout(7500);
      await expect(dialog(page)).toHaveAccessibleName("Prep story");
      await page.mouse.move(2, 2);
    }
    await expect(dialog(page)).not.toHaveAccessibleName("Prep story", { timeout: 9000 });
  });
});
