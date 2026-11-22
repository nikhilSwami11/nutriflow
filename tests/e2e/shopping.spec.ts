import { expect, test } from "@playwright/test";

test("a sleek plain list: amounts prefilled, tap turns it green then it goes into the shopped count, undo", async ({ page }) => {
  await page.goto("/shopping");

  // no store chosen: still a working shopping list
  await expect(page.getByRole("button", { name: "Choose a store" })).toBeVisible();
  const list = page.getByRole("region", { name: "To buy" });
  await expect(list.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0); // units are not the user's to pick

  const first = list.getByRole("button", { name: /, tap when shopped$/ }).first();
  const name = ((await first.getAttribute("aria-label")) ?? "").replace(", tap when shopped", "");
  const total = await list.getByRole("button", { name: /, tap when shopped$/ }).count();
  const how = page.getByRole("group", { name: `How much ${name}` });

  // change the quantity; the prefilled unit stays
  const before = (await how.textContent())!;
  await page.getByRole("button", { name: `More ${name}` }).click();
  await expect(how).not.toHaveText(before);
  await page.getByRole("button", { name: `Less ${name}` }).click();
  await expect(how).toHaveText(before);

  // tap: the row goes green, then goes, and the green count in the header counts it
  await first.click();
  await expect(page.getByRole("button", { name: /^1 of \d+ shopped$/ })).toBeVisible();
  await expect(page.getByText(total > 1 ? `${total - 1} to buy` : "All bought")).toBeVisible();

  // open the count: what was shopped, with its amount, and undo
  await page.getByRole("button", { name: /^1 of \d+ shopped$/ }).click();
  await expect(page.getByText("Kept here for 12 hours, and in your pantry.")).toBeVisible();
  await page.getByRole("button", { name: `Undo ${name}` }).click();
  await expect(page.getByText(`${total} to buy`)).toBeVisible();
  await expect(how).toHaveText(before);
});

test("choose a store: a bad ZIP cannot be saved, then every item links to the store", async ({ page }) => {
  await page.goto("/shopping");
  await page.getByRole("button", { name: "Choose a store" }).click();
  await page.getByLabel("ZIP code").fill("941");
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  await page.getByLabel("ZIP code").fill("94103");
  await page.getByRole("button", { name: "Aldi" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Aldi · 94103" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Find .* at Aldi$/ }).first()).toHaveAttribute("href", /^https:\/\/www\.aldi\.us\/results\?q=/);
});
