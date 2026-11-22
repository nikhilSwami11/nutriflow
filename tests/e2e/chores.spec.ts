import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/chores");
});

test("tick a chore, it moves to Done, untick brings it back", async ({ page }) => {
  const todo = page.getByRole("region", { name: "To do" });
  await expect(todo.getByRole("button", { name: "Dishes after dinner, to do" })).toBeVisible();
  await todo.getByRole("button", { name: "Dishes after dinner, to do" }).click();
  const done = page.getByRole("region", { name: "Done" });
  await expect(done.getByRole("button", { name: "Dishes after dinner, done" })).toBeVisible();
  await expect(done.getByText("Done today")).toBeVisible();
  await done.getByRole("button", { name: "Dishes after dinner, done" }).click();
  await expect(todo.getByRole("button", { name: "Dishes after dinner, to do" })).toBeVisible();
});

test("add and remove a chore", async ({ page }) => {
  await page.getByLabel("Add a chore").fill("Water the plants");
  await page.getByRole("button", { name: "Every week" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const row = page.getByRole("button", { name: "Water the plants, to do" });
  await expect(row).toBeVisible();
  await expect(page.getByRole("region", { name: "To do" })).toContainText("Every ");
  await page.getByRole("button", { name: "Remove Water the plants" }).click();
  await expect(row).toHaveCount(0);
});

test("Add stays off until there is a title", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add", exact: true })).toBeDisabled();
});
