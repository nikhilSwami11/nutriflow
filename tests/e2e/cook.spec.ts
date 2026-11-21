import { expect, test, type Page } from "@playwright/test";

const eaten = (page: Page) => page.getByRole("status", { name: "Servings eaten" });
const stepText = (page: Page, text: string) => page.locator("p[aria-live=polite]", { hasText: text });
const next = (page: Page) => page.getByRole("button", { name: /Next step|Finish|Mark done/ });

test("start cooking opens step one with progress and a disabled back button", async ({ page }) => {
  await page.goto("/recipes/dal-tadka");
  await page.getByRole("link", { name: "Start cooking" }).click();
  await expect(page).toHaveURL(/\/cook\/dal-tadka\?servings=4/);
  await expect(stepText(page, "Chop the onions and tomatoes")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Recipe progress" })).toHaveAttribute("aria-valuetext", "Step 1 of 6");
  await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
  await expect(page.locator(".cook-motion svg")).toBeVisible(); // the chop loop
  await page.getByRole("link", { name: "Close cooking" }).click();
  await expect(page).toHaveURL("/");
});

test("servings picked on the recipe page carry into the cook", async ({ page }) => {
  await page.goto("/recipes/dal-tadka");
  await page.getByRole("button", { name: "More servings" }).click();
  await page.getByRole("button", { name: "More servings" }).click();
  await page.getByRole("link", { name: "Start cooking" }).click();
  await expect(page).toHaveURL(/servings=6/);
  for (let i = 0; i < 6; i++) await next(page).click();
  await expect(page.getByText("You made 6 servings. How many did you eat?")).toBeVisible();
});

test.describe("a whole cook", () => {
  test("timer counts down and ends with Time's up; finishing logs the meal and uses up the pantry", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-21T12:00:00") });
    await page.goto("/cook/dal-tadka");
    await expect(stepText(page, "Chop the onions and tomatoes")).toBeVisible();
    await next(page).click(); // step 2: boil the dal (a timed step)
    await expect(stepText(page, "Boil the dal until soft")).toBeVisible();
    await expect(page.getByRole("timer")).toHaveText("10:00");
    await page.getByRole("button", { name: "Start timer" }).click();
    await page.clock.fastForward("04:00");
    await expect(page.getByRole("timer")).toHaveText("6:00");
    await page.getByRole("button", { name: "Pause" }).click();
    await page.clock.fastForward("05:00");
    await expect(page.getByRole("timer")).toHaveText("6:00"); // paused, so it did not move
    await page.getByRole("button", { name: "Resume" }).click();
    await page.clock.fastForward("06:01");
    await expect(page.getByText("Time’s up").first()).toBeVisible();
    await page.getByRole("button", { name: /Time.s up. Mark done/ }).click();

    for (let i = 0; i < 4; i++) await next(page).click(); // steps 3..6, then Finish on the last
    await expect(page.getByRole("heading", { name: "Nicely done" })).toBeVisible();
    await expect(page.getByText("You made 4 servings. How many did you eat?")).toBeVisible();
    await expect(eaten(page)).toHaveText("1");
    await expect(page.getByText("kcal from what you cooked")).toContainText("480");
    await page.getByRole("button", { name: "More servings eaten" }).click();
    await expect(eaten(page)).toHaveText("1.5");
    await expect(page.getByText("kcal from what you cooked")).toContainText("720");

    await page.getByRole("button", { name: "Log it" }).click();
    await expect(page.getByRole("heading", { name: "Logged 720 kcal" })).toBeVisible();
    const pantry = page.getByLabel("Pantry updated");
    await expect(pantry).toContainText("items used up");
    await expect(pantry).toContainText("not fully in stock"); // the seeded pantry has 1 onion; the recipe needs 2
    await expect(page.getByLabel("Your serving size")).toContainText("You ate more than one serving, so I will estimate your next dal tadka a little higher.");

    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL("/");
    // the dinner is now really logged: its story shows eaten and today's number includes it
    await expect(page.getByRole("button", { name: "Dinner story, eaten" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Today", exact: true })).toContainText("1,140"); // 420 breakfast + 720
  });

  test("the next cook starts from your usual serving size", async ({ page }) => {
    await page.goto("/cook/dal-tadka");
    for (let i = 0; i < 6; i++) await next(page).click();
    await page.getByRole("button", { name: "More servings eaten" }).click();
    await page.getByRole("button", { name: "Log it" }).click();
    await expect(page.getByRole("heading", { name: /Logged/ })).toBeVisible();
    await page.goto("/cook/dal-tadka");
    for (let i = 0; i < 6; i++) await next(page).click();
    await expect(eaten(page)).toHaveText("1.5");
  });

  test("the pantry shows what was used", async ({ page }) => {
    await page.goto("/cook/dal-tadka");
    for (let i = 0; i < 6; i++) await next(page).click();
    await page.getByRole("button", { name: "Log it" }).click();
    await expect(page.getByRole("heading", { name: /Logged/ })).toBeVisible();
    await page.getByRole("link", { name: "Back to home" }).click();
    await page.getByRole("link", { name: "Pantry" }).first().click();
    await expect(page.getByText("2 cups")).toBeVisible(); // toor dal 3 -> 2
  });
});

test("servings eaten stay between half a serving and what was made", async ({ page }) => {
  await page.goto("/cook/dal-tadka?servings=2");
  for (let i = 0; i < 6; i++) await next(page).click();
  const less = page.getByRole("button", { name: "Fewer servings eaten" });
  const more = page.getByRole("button", { name: "More servings eaten" });
  await less.click();
  await expect(eaten(page)).toHaveText("0.5");
  await expect(less).toBeDisabled();
  for (let i = 0; i < 6; i++) if (await more.isEnabled()) await more.click();
  await expect(eaten(page)).toHaveText("2");
  await expect(more).toBeDisabled();
});

test("voice commands move through the steps and start the timer", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeSR {
      continuous = false; interimResults = false; lang = ""; onresult: ((e: unknown) => void) | null = null; onend: (() => void) | null = null; onerror: (() => void) | null = null;
      start() { (window as unknown as { __sr: FakeSR }).__sr = this; }
      stop() {}
    }
    (window as unknown as Record<string, unknown>).SpeechRecognition = FakeSR;
  });
  await page.goto("/cook/dal-tadka");
  const say = (text: string) => page.evaluate((t) => (window as unknown as { __sr: { onresult(e: unknown): void } }).__sr.onresult({ resultIndex: 0, results: [[{ transcript: t }]] }), text);
  await page.getByRole("button", { name: "Voice control" }).click();
  await expect(page.getByRole("button", { name: "Voice control" })).toHaveAttribute("aria-pressed", "true");
  await say("next step");
  await expect(stepText(page, "Boil the dal until soft")).toBeVisible();
  await say("start the timer");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await say("pause timer");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await say("go back");
  await expect(stepText(page, "Chop the onions and tomatoes")).toBeVisible();
  await say("add butter to my list"); // not a command: ignored
  await expect(stepText(page, "Chop the onions and tomatoes")).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the cooking loops stand still", async ({ page }) => {
    await page.goto("/cook/dal-tadka");
    const name = await page.locator(".cook-motion .ch-knife").evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe("none");
  });
});

test("an unknown recipe shows not found", async ({ page }) => {
  await page.goto("/cook/nope");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});
