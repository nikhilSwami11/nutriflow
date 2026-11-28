import { expect, test, type Page } from "@playwright/test";

const eaten = (page: Page) => page.getByRole("status", { name: "Servings eaten" });
const stepText = (page: Page, text: string) => page.locator("span[aria-live=polite]", { hasText: text });
/** Open a cook screen: it starts on the first action (Wash for dal tadka). Dal tadka has 7 actions. */
const begin = async (page: Page, path: string) => {
  await page.goto(path);
};
const next = (page: Page) => page.getByRole("button", { name: /Done · next action|Finish|Mark done/ });
const jump = (page: Page, verb: string) => page.getByRole("tab", { name: verb }).click();
const ACTIONS = 7;

test("start cooking opens the cook: actions stay on screen, the first one shows, nothing else to press", async ({ page }) => {
  await page.goto("/recipes/dal-tadka");
  await page.getByRole("link", { name: "Start cooking" }).click();
  await expect(page).toHaveURL(/\/cook\/dal-tadka\?servings=4/);
  const tabs = page.getByRole("tablist", { name: "Actions" });
  await expect(tabs.getByRole("tab")).toHaveCount(ACTIONS);
  await expect(tabs.getByRole("tab", { name: "Wash" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Wash tasks")).toContainText("Rinse toor dal");
  await next(page).click();
  await expect(tabs.getByRole("tab", { name: "Boil" })).toHaveAttribute("aria-selected", "true");
  await expect(tabs.getByRole("tab", { name: "Wash" }).getByLabel("done")).toBeVisible(); // a tick on what is done
  await expect(stepText(page, "Boil the dal with the water, turmeric and half the salt")).toBeVisible();
  await expect(page.locator(".cook-motion svg")).toBeVisible(); // the chop loop
  await page.getByRole("link", { name: "Close cooking" }).click();
  await expect(page).toHaveURL("/");
});

test("tasks tick on their own, and a swipe moves to the next action", async ({ page, isMobile }) => {
  test.skip(!isMobile, "swipe is for touch");
  await page.goto("/cook/dal-tadka");
  await page.getByText("Rinse toor dal").click();
  await expect(page.getByLabel("Wash tasks").getByRole("checkbox").first()).toBeChecked();
  // Left swipe = next action (touch only); the handler is on the cook area.
  const area = page.locator("div.touch-pan-y");
  await area.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 300, clientY: 400, bubbles: true });
  await area.dispatchEvent("pointerup", { pointerType: "touch", clientX: 80, clientY: 410, bubbles: true });
  await expect(page.getByRole("tab", { name: "Boil" })).toHaveAttribute("aria-selected", "true");
  await area.dispatchEvent("pointerdown", { pointerType: "touch", clientX: 80, clientY: 400, bubbles: true });
  await area.dispatchEvent("pointerup", { pointerType: "touch", clientX: 300, clientY: 400, bubbles: true });
  await expect(page.getByRole("tab", { name: "Wash" })).toHaveAttribute("aria-selected", "true");
});

test("servings picked on the recipe page carry into the cook", async ({ page }) => {
  await page.goto("/recipes/dal-tadka");
  await page.getByRole("button", { name: "More servings" }).click();
  await page.getByRole("button", { name: "More servings" }).click();
  await page.getByRole("link", { name: "Start cooking" }).click();
  await expect(page).toHaveURL(/servings=6/);
  await page.getByRole("button", { name: "Views" }).click();
  await page.getByRole("button", { name: "Ingredients" }).click();
  await expect(page.getByText("for 6 servings")).toBeVisible();
  await page.getByRole("button", { name: "Actions" }).click();
  for (let i = 0; i < ACTIONS; i++) await next(page).click();
  await expect(page.getByText("You made 6 servings. How many did you eat?")).toBeVisible();
});

test.describe("a whole cook", () => {
  test("timer counts down and ends with Time's up; finishing logs the meal and uses up the pantry", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-21T12:00:00") });
    await begin(page, "/cook/dal-tadka");
    await next(page).click(); // Wash done: now Boil the dal (a timed step)
    await expect(stepText(page, "Boil the dal with the water, turmeric and half the salt")).toBeVisible();
    await expect(page.getByRole("timer")).toHaveText("20:00");
    await page.getByRole("button", { name: "Start" }).click();
    await page.clock.fastForward("04:00");
    await expect(page.getByRole("timer")).toHaveText("16:00");
    await page.getByRole("button", { name: "Pause" }).click();
    await page.clock.fastForward("05:00");
    await expect(page.getByRole("timer")).toHaveText("16:00"); // paused, so it did not move
    await page.getByRole("button", { name: "Resume" }).click();
    await page.clock.fastForward("16:01");
    await expect(page.getByText("Time’s up").first()).toBeVisible();
    await page.getByRole("button", { name: /Time.s up. Mark done/ }).click();

    for (let i = 0; i < 5; i++) await next(page).click(); // Mash, Chop, Sauté, Stir, then Finish on Simmer
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
    await expect(page.getByLabel("Your serving size")).toContainText("You ate more than one serving, so I will estimate your next dal tadka a little higher.");

    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page).toHaveURL("/");
    // the dinner is now really logged: it leaves Up next and today's number includes it
    await expect(page.getByRole("article", { name: "Up next" }).getByText(/Dinner/)).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Today", exact: true })).toContainText("1,170"); // 450 breakfast + 720
  });

  test("the next cook starts from your usual serving size", async ({ page }) => {
    await begin(page, "/cook/dal-tadka");
    for (let i = 0; i < ACTIONS; i++) await next(page).click();
    await page.getByRole("button", { name: "More servings eaten" }).click();
    await page.getByRole("button", { name: "Log it" }).click();
    await expect(page.getByRole("heading", { name: /Logged/ })).toBeVisible();
    await begin(page, "/cook/dal-tadka");
    for (let i = 0; i < ACTIONS; i++) await next(page).click();
    await expect(eaten(page)).toHaveText("1.5");
  });

  test("the pantry shows what was used", async ({ page }) => {
    await begin(page, "/cook/dal-tadka");
    for (let i = 0; i < ACTIONS; i++) await next(page).click();
    await page.getByRole("button", { name: "Log it" }).click();
    await expect(page.getByRole("heading", { name: /Logged/ })).toBeVisible();
    await page.getByRole("link", { name: "Back to home" }).click();
    await page.getByRole("link", { name: "Kitchen" }).first().click();
    await expect(page.getByRole("region", { name: "In stock" }).getByText("2 cups")).toBeVisible(); // toor dal 3 -> 2
  });
});

test("servings eaten stay between half a serving and what was made", async ({ page }) => {
  await begin(page, "/cook/dal-tadka?servings=2");
  for (let i = 0; i < ACTIONS; i++) await next(page).click();
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
  await begin(page, "/cook/dal-tadka");
  const say = (text: string) => page.evaluate((t) => (window as unknown as { __sr: { onresult(e: unknown): void } }).__sr.onresult({ resultIndex: 0, results: [[{ transcript: t }]] }), text);
  await page.getByRole("button", { name: "Voice control" }).click();
  await expect(page.getByRole("button", { name: "Voice control" })).toHaveAttribute("aria-pressed", "true");
  await say("next step");
  await expect(stepText(page, "Boil the dal with the water, turmeric and half the salt")).toBeVisible();
  await say("start the timer");
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await say("pause timer");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await say("go back");
  await expect(page.getByRole("tab", { name: "Wash" })).toHaveAttribute("aria-selected", "true");
  await say("add butter to my list"); // not a command: ignored
  await expect(page.getByRole("tab", { name: "Wash" })).toHaveAttribute("aria-selected", "true");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the cooking loops stand still", async ({ page }) => {
    await begin(page, "/cook/dal-tadka");
    await jump(page, "Chop");
    const name = await page.locator(".cook-motion .ch-knife").evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe("none");
  });
});

test("an unknown recipe shows not found", async ({ page }) => {
  await page.goto("/cook/nope");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});

test.describe("the cooking guide", () => {
  test("Ingredients: a checklist to tick off, and what to use for anything missing", async ({ page }) => {
    await page.goto("/cook/dal-tadka");
    await page.getByRole("button", { name: "Views" }).click();
    await page.getByRole("button", { name: "Ingredients" }).click();
    await expect(page.getByText("Set these out before you start. About 40 minutes for 4 servings.")).toBeVisible();
    const items = page.getByRole("list", { name: "Ingredients" }).getByRole("checkbox");
    await expect(items).toHaveCount(18);
    await expect(page.getByRole("status")).toHaveText("0 of 18 set out");
    // tap the row, as a person would: the checkbox itself is visually hidden behind a larger tap target
    await page.getByText("1 cup toor dal").click();
    await page.getByText("5 cloves garlic").click();
    await expect(items.nth(0)).toBeChecked();
    await expect(page.getByRole("status")).toHaveText("2 of 18 set out");
    await page.getByText("5 cloves garlic").click();
    await expect(items.nth(8)).not.toBeChecked();
    await expect(page.getByRole("status")).toHaveText("1 of 18 set out");
    const missing = page.getByLabel("Not in your pantry");
    await expect(missing).toContainText("Fresh coriander");
    await expect(missing).toContainText("use mint or parsley, or leave it out");
  });

  test("every step says what to look for and gives a tip", async ({ page }) => {
    await begin(page, "/cook/dal-tadka");
    await jump(page, "Boil");
    await expect(page.getByLabel("Look for")).toContainText("falls apart when pressed between two fingers");
    await expect(page.getByLabel("Tip")).toContainText("Skim the foam");
    await jump(page, "Sauté"); // the tadka
    await expect(stepText(page, "Heat the ghee until it shimmers")).toBeVisible();
    await expect(page.getByLabel("Look for")).toContainText("The cumin crackles in seconds");
    await expect(page.getByLabel("Tip")).toContainText("Dark garlic tastes bitter");
  });

  test("a recipe without hand-written notes still gets guidance for its verbs", async ({ page }) => {
    await begin(page, "/cook/chana");
    await jump(page, "Mix");
    await expect(page.getByLabel("Look for")).not.toBeEmpty();
    await expect(page.getByLabel("Tip")).not.toBeEmpty();
  });

  test("Ask: suggestions, typed questions, answers from the recipe, and a clear limit", async ({ page }) => {
    await begin(page, "/cook/dal-tadka");
    await jump(page, "Sauté"); // the tadka step
    await page.getByRole("button", { name: "Ask about this step" }).click();
    const sheet = page.getByRole("dialog", { name: "Ask about this step" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Ask", exact: true })).toBeDisabled(); // nothing typed yet
    await sheet.getByRole("button", { name: "How do I know it is done?" }).click();
    const log = sheet.getByRole("log");
    await expect(log).toContainText("How do I know it is done?");
    await expect(log).toContainText("The cumin crackles in seconds and the garlic turns pale gold.");
    await sheet.getByLabel("Your question").fill("the garlic is bitter");
    await sheet.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(log).toContainText("Make the tadka again with fresh garlic");
    await expect(sheet.getByLabel("Your question")).toHaveValue("");
    await sheet.getByLabel("Your question").fill("I don't have butter");
    await sheet.getByLabel("Your question").press("Enter");
    await expect(log).toContainText("Use ghee or a neutral oil.");
    await sheet.getByLabel("Your question").fill("what is the capital of France?");
    await sheet.getByLabel("Your question").press("Enter");
    await expect(log).toContainText("I can help with this step");
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("Ask follows the step you are on", async ({ page }) => {
    await begin(page, "/cook/dal-tadka");
    await jump(page, "Boil"); // 15 minutes
    await page.getByRole("button", { name: "Ask about this step" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "How long does it take?" }).click();
    await expect(page.getByRole("log")).toContainText("About 20 minutes");
  });
});

test("Meanwhile shows what can run while a timed action runs", async ({ page }) => {
  await page.goto("/cook/dal-tadka");
  await jump(page, "Boil");
  const card = page.getByRole("tabpanel", { name: "Boil" });
  await expect(card).toContainText("20 min");
  await expect(card.getByLabel("At the same time")).toHaveCount(0);
  await page.getByRole("button", { name: "Meanwhile" }).click();
  await expect(card.getByLabel("At the same time")).toContainText("Chop");
});

test("Recipe view: the whole recipe in order, split into its parts, every step numbered", async ({ page }) => {
  await page.goto("/cook/dal-tadka");
  await page.getByRole("button", { name: "Views" }).click();
  await page.getByRole("button", { name: "Recipe" }).click();
  await expect(page.getByLabel("Dal")).toContainText("Toor dal");
  await expect(page.getByLabel("Dal").getByRole("listitem").filter({ hasText: "Boil the dal with the water" })).toContainText("20 min");
  await expect(page.getByLabel("Tadka")).toContainText("Heat the ghee until it shimmers");
  await expect(page.getByLabel("Finish")).toContainText("Taste and adjust the salt, sourness and heat");
  await expect(page.locator("ol li")).toHaveCount(9);
});
