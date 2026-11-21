import { expect, test } from "@playwright/test";

test("sidebar on desktop, bottom nav on mobile", async ({ page, isMobile }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Today" })).toHaveCount(isMobile ? 0 : 1);
  await expect(nav.getByRole("link", { name: "Home" })).toHaveCount(isMobile ? 1 : 0);
  if (!isMobile) {
    await expect(page.getByRole("heading", { name: "What are we cooking tonight?" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Plan" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Recipes" })).toBeVisible();
  }
});

for (const width of [320, 360, 412]) {
  test(`camera button is fully visible and tappable at ${width}px wide`, async ({ page, isMobile }) => {
    test.skip(!isMobile, "bottom nav is the mobile layout");
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/");
    const btn = page.getByRole("button", { name: "Open camera or voice" });
    await expect(btn).toBeVisible();
    const box = (await btn.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(700);
    expect(box.width).toBeGreaterThanOrEqual(44);
    // nothing sits on top of any edge of the circle
    const covered = await btn.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return [[r.x + r.width / 2, r.top + 2], [r.x + r.width / 2, r.bottom - 2], [r.left + 2, r.y + r.height / 2], [r.right - 2, r.y + r.height / 2]].some(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return !(hit && (hit === el || el.contains(hit)));
      });
    });
    expect(covered).toBe(false);
    // all five nav items fit side by side
    const navBox = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
    expect(navBox.width).toBeLessThanOrEqual(width);
    for (const name of ["Home", "Recipes", "Pantry", "Profile"]) await expect(page.getByRole("navigation", { name: "Main" }).getByLabel(name)).toBeVisible();
  });
}
