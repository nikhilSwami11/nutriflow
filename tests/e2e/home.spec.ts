import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("home shows every dashboard section", async ({ page }) => {
  for (const name of ["Today", "Calories and macros", "Today vs plan", "Up next", "Tonight", "Suggested for you", "Pantry alert"]) {
    await expect(page.getByRole(name === "Today" || name === "Suggested for you" ? "region" : "article", { name })).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Today" })).toContainText("1,420");
});

test("range tabs switch the chart between 7 and 30 days", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Calories and macros, last 7 days" })).toBeVisible();
  await page.getByRole("button", { name: "30 days" }).click();
  await expect(page.getByRole("heading", { name: "Calories and macros, last 30 days" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Day" })).toHaveAttribute("aria-valuemax", "29");
});

test("hovering the chart glides to that day", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover is a desktop interaction");
  const box = (await page.getByRole("slider", { name: "Day" }).boundingBox())!;
  await page.mouse.move(box.x + box.width * (2 / 6), box.y + box.height / 2); // 7-day week: index 2 is 2,100 kcal
  await expect(page.getByText("Eaten 2,100 kcal")).toBeVisible();
  await expect(page.getByText("+100 kcal vs plan")).toBeVisible();
  await page.mouse.move(box.x + box.width + 40, box.y + box.height / 2);
  await expect(page.getByText("kcal left today")).toBeVisible(); // leaving returns to today
});

test("chart is keyboard operable", async ({ page }) => {
  const slider = page.getByRole("slider", { name: "Day" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "1");
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "6");
});

test("logging dinner updates today and can't double count", async ({ page }) => {
  await expect(page.getByText("480 left")).toBeVisible();
  await page.getByRole("button", { name: "Log dinner" }).click();
  await expect(page.getByRole("region", { name: "Today" })).toContainText("1,900");
  await expect(page.getByText("0 left")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dinner logged" })).toBeDisabled();
});

test("accepting a suggestion marks it done", async ({ page }) => {
  await page.getByRole("button", { name: "Add a protein snack at 4 pm, Add to plan" }).click();
  await expect(page.getByRole("button", { name: /Add a protein snack at 4 pm/ })).toContainText("Done");
});

test("buy tile adds running-low items to the list", async ({ page }) => {
  const tile = page.getByRole("button", { name: /^Buy / });
  await expect(tile).toContainText("Add to list");
  await tile.click();
  await expect(tile).toContainText("On the list");
});

test("nav reaches pantry", async ({ page }) => {
  await page.getByRole("link", { name: "Pantry" }).click();
  await expect(page.getByRole("heading", { name: "Pantry" })).toBeVisible();
});

test("tapping the chart on touch jumps to that day", async ({ page, isMobile }) => {
  test.skip(!isMobile, "touch only");
  const slider = page.getByRole("slider", { name: "Day" });
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  await page.touchscreen.tap(box.x + 2, box.y + box.height / 2);
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
});
