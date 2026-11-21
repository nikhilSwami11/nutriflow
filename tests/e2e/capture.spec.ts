import { expect, test, type Page } from "@playwright/test";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const sheet = (page: Page) => page.getByRole("dialog", { name: "Camera or voice" });
const openSheet = async (page: Page) => {
  await page.getByRole("button", { name: "Open camera or voice" }).click();
  await expect(sheet(page)).toBeVisible();
};

test.describe("the camera and voice sheet (mobile)", () => {
  test.beforeEach(async ({ page, isMobile }) => {
    test.skip(!isMobile, "the camera button is the mobile layout");
    await page.goto("/");
  });

  test("opens from the camera button, has two tabs, closes with Escape", async ({ page }) => {
    await openSheet(page);
    await expect(sheet(page).getByRole("button", { name: "Camera", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(sheet(page).getByRole("button", { name: "Voice" })).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toHaveCount(0);
  });

  test("only meal photos work: shelf and receipt scanning are shown but disabled", async ({ page }) => {
    await openSheet(page);
    await expect(sheet(page).getByRole("button", { name: "Meal" })).toBeEnabled();
    await expect(sheet(page).getByRole("button", { name: "Pantry shelf" })).toBeDisabled();
    await expect(sheet(page).getByRole("button", { name: "Receipt" })).toBeDisabled();
  });

  test("the camera starts, and the shutter takes a real photo and opens the meal screen", async ({ page }) => {
    await openSheet(page);
    const video = sheet(page).getByLabel("Camera preview");
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.videoWidth)).toBeGreaterThan(0);
    await sheet(page).getByRole("button", { name: "Take photo" }).click();
    await expect(page).toHaveURL(/\/photo$/);
    await expect(page.getByRole("img", { name: "Your meal" })).toBeVisible();
  });

  test("choose from photos opens the meal screen with that picture", async ({ page }) => {
    await openSheet(page);
    await sheet(page).getByLabel("Photo file").setInputFiles({ name: "meal.png", mimeType: "image/png", buffer: PNG });
    await expect(page).toHaveURL(/\/photo$/);
    await expect(page.getByRole("img", { name: "Your meal" })).toBeVisible();
  });

  test("a file that is not an image is ignored", async ({ page }) => {
    await openSheet(page);
    await sheet(page).getByLabel("Photo file").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page).toHaveURL("/");
    await expect(sheet(page)).toBeVisible();
  });

  test("voice: an example phrase is heard, confirmed, and updates the pantry", async ({ page }) => {
    await openSheet(page);
    await sheet(page).getByRole("button", { name: "Voice" }).click();
    await expect(sheet(page).getByRole("status")).toHaveText("Tap the mic and speak");
    await sheet(page).getByRole("button", { name: "I have 3 onions, 2 tomatoes and butter" }).click();
    for (const chip of ["Onions +3", "Tomatoes +2", "Butter +1"]) await expect(sheet(page).getByText(chip)).toBeVisible();
    await sheet(page).getByRole("button", { name: "Add to pantry" }).click();
    await expect(sheet(page).getByRole("status")).toHaveText("Pantry updated.");
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Pantry" }).click();
    await expect(page.getByText("4 pcs").first()).toBeVisible(); // onions 1 + 3
  });

  test("voice: 'What can I make tonight?' opens recipes, 'Start cooking' opens the next meal's cook screen", async ({ page }) => {
    await openSheet(page);
    await sheet(page).getByRole("button", { name: "Voice" }).click();
    await sheet(page).getByRole("button", { name: "What can I make tonight?" }).click();
    await expect(page).toHaveURL(/\/recipes$/);
    await page.goto("/");
    await openSheet(page);
    await sheet(page).getByRole("button", { name: "Voice" }).click();
    await sheet(page).getByRole("button", { name: "Start cooking" }).click();
    await expect(page).toHaveURL(/\/cook\//);
  });
});

test.describe("the meal photo flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/photo");
    await expect(page.getByRole("heading", { name: "What I can see" })).toBeVisible();
  });

  test("detect: says it is an example, lets you include or leave out items, and add a missed one", async ({ page }) => {
    await expect(page.getByRole("note")).toContainText("not connected yet");
    await expect(page.getByText("3 of 3")).toBeVisible();
    await expect(page.getByText("Matched with your pantry: toor dal, basmati rice, ghee.")).toBeVisible();
    await page.getByRole("button", { name: /^Ghee/ }).click();
    await expect(page.getByText("2 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Estimate with 2 items" })).toBeVisible();
    for (const n of ["Dal tadka", "Rice"]) await page.getByRole("button", { name: new RegExp(`^${n}`) }).click();
    await expect(page.getByRole("button", { name: "Pick at least one item" })).toBeDisabled();
    for (const n of ["Dal tadka", "Rice", "Ghee"]) await page.getByRole("button", { name: new RegExp(`^${n}`) }).click();
    await page.getByRole("button", { name: "Add an item I missed" }).click();
    await page.getByRole("menuitem", { name: "Roti" }).click();
    await expect(page.getByText("4 of 4")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Roti" })).toHaveCount(0);
  });

  test("estimate: totals follow the amounts, with a range, the day's impact and the reasons", async ({ page }) => {
    await page.getByRole("button", { name: "Estimate with 3 items" }).click();
    await expect(page.getByLabel("573 kilocalories")).toBeVisible(); // 1.3 x 230 + 0.75 x 205 + 1 x 120
    await expect(page.getByText("kcal, likely 504 to 642")).toBeVisible();
    await expect(page.getByText(/Your day would be at .* of 1,900 kcal/)).toBeVisible();
    await page.getByRole("button", { name: "More Rice" }).click();
    await expect(page.getByLabel("624 kilocalories")).toBeVisible(); // + 0.25 cup of rice (51)
    await page.getByRole("button", { name: "Less Ghee" }).click();
    await page.getByRole("button", { name: "Less Ghee" }).click();
    await page.getByRole("button", { name: "Less Ghee" }).click(); // 1 tbsp - 3 x 0.5 stops at 0
    await expect(page.getByText("0 tbsp", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Why this estimate" }).click();
    await expect(page.getByText("Photo recognition is not connected yet")).toBeVisible();
  });

  test("Wrong dish goes back to the items", async ({ page }) => {
    await page.getByRole("button", { name: "Estimate with 3 items" }).click();
    await page.getByRole("button", { name: "Wrong dish" }).click();
    await expect(page.getByRole("heading", { name: "What I can see" })).toBeVisible();
  });

  test("log shows the result and Home marks that meal eaten", async ({ page }) => {
    await page.getByRole("button", { name: "Estimate with 3 items" }).click();
    await page.getByRole("button", { name: "Log it" }).click();
    await expect(page.getByText("573 kcal")).toBeVisible();
    await expect(page.getByText("Logged for lunch.")).toBeVisible(); // the next planned meal is lunch
    await expect(page.getByText("I will remember these portions")).toBeVisible();
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page.getByRole("button", { name: "Lunch story, eaten" })).toBeVisible();
  });

  test("Undo takes the meal back off Home, and it can be logged again", async ({ page }) => {
    await page.getByRole("button", { name: "Estimate with 3 items" }).click();
    await page.getByRole("button", { name: "Log it" }).click();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByLabel(/kilocalories/)).toBeVisible(); // back on the estimate
    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("link", { name: "Close" }).click();
    await expect(page.getByRole("button", { name: "Lunch story, new" })).toBeVisible(); // not eaten any more
    await page.getByRole("button", { name: "Lunch story, new" }).click();
    await page.keyboard.press("Escape");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the scan line stands still", async ({ page }) => {
    await page.goto("/photo");
    const name = await page.locator(".scan").first().evaluate((el) => getComputedStyle(el).animationName);
    expect(name).toBe("none");
  });
});
