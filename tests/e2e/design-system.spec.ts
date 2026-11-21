import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * The design system, enforced. One reading size floor, one touch size floor, readable contrast, one page gutter.
 * See "Design system" in CLAUDE.md for the rules and why.
 */
const ROUTES = ["/", "/pantry", "/recipes", "/recipes/dal-tadka", "/plan", "/cook/dal-tadka", "/cook/dal-tadka#steps", "/photo", "/signin"];
const settle = async (page: Page, route: string) => {
  await page.goto(route.replace("#steps", ""));
  if (route.endsWith("#steps")) await page.getByRole("button", { name: "Start cooking" }).click();
  await page.waitForTimeout(route === "/photo" ? 1800 : 1200);
};

for (const route of ROUTES) {
  test.describe(route, () => {
    test("no visible text under 12px", async ({ page }) => {
      await settle(page, route);
      const small = await page.evaluate(() => {
        const out: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const el = n.parentElement;
          if (!el || !n.textContent?.trim() || el.closest("svg, script, style, .sr-only, canvas")) continue;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || r.height === 0) continue;
          if (parseFloat(cs.fontSize) < 12) out.push(`${parseFloat(cs.fontSize)}px "${n.textContent.trim().slice(0, 30)}"`);
        }
        return out;
      });
      expect(small).toEqual([]);
    });

    test("every button and link is at least 44px to tap", async ({ page, isMobile }) => {
      test.skip(!isMobile, "touch sizes matter on the phone layout");
      await settle(page, route);
      const small = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("button, a[href], [role=tab], [role=menuitem], input, [role=slider]")) {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (cs.display === "none" || cs.visibility === "hidden" || r.width === 0 || el.closest(".sr-only") || el.classList.contains("sr-only")) continue;
          if (el.matches("input[type=file]")) continue;
          // an inline link inside a sentence is allowed to be text-sized
          const inline = el.tagName === "A" && cs.display === "inline";
          if (inline) continue;
          if (r.height < 43.5 || r.width < 43.5) out.push(`${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28)}"`);
        }
        return out;
      });
      expect(small).toEqual([]);
    });

    test("colour contrast passes", async ({ page }) => {
      await settle(page, route);
      const r = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
      expect(r.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(" ")} ${n.failureSummary?.split("\n")[1] ?? ""}`))).toEqual([]);
    });
  });
}

test("page titles share one left gutter of 20px on the phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone layout");
  const lefts: Record<string, number> = {};
  for (const route of ["/pantry", "/recipes", "/plan"]) {
    await settle(page, route);
    lefts[route] = await page.getByRole("heading", { level: 1 }).first().evaluate((el) => Math.round(el.getBoundingClientRect().left));
  }
  expect(lefts).toEqual({ "/pantry": 20, "/recipes": 20, "/plan": 20 });
});

test("the home feed keeps the same 20px left edge as the page", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone layout");
  await settle(page, "/");
  const lefts = await page.evaluate(() => {
    const left = (el: Element | null) => Math.round(el?.getBoundingClientRect().left ?? -1);
    return {
      title: left(document.querySelector("header div")),
      firstStory: left(document.querySelector('[role=list][aria-label=Stories] button')),
      postIcon: left(document.querySelector("article[aria-label='Up next'] > div:first-child > span")),
      caption: left(document.querySelector("article[aria-label='Up next'] h3")),
    };
  });
  expect(lefts).toEqual({ title: 20, firstStory: 20, postIcon: 20, caption: 20 });
});

test("page titles share one size and weight", async ({ page }) => {
  const seen: Record<string, string> = {};
  for (const route of ["/pantry", "/recipes", "/plan"]) {
    await settle(page, route);
    seen[route] = await page.getByRole("heading", { level: 1 }).first().evaluate((el) => `${getComputedStyle(el).fontSize}/${getComputedStyle(el).fontWeight}`);
  }
  expect(new Set(Object.values(seen)).size).toBe(1);
});

test("cards share one corner radius, buttons are pills", async ({ page }) => {
  const radii = new Set<string>();
  for (const route of ["/", "/recipes", "/plan"]) {
    await settle(page, route);
    const found = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("article, section")].filter((e) => getComputedStyle(e).borderTopWidth !== "0px" && e.getBoundingClientRect().width > 200).map((e) => getComputedStyle(e).borderTopLeftRadius),
    );
    found.forEach((r) => radii.add(r));
  }
  expect([...radii]).toEqual(["20px"]);
});

test("the Ask sheet is readable too", async ({ page }) => {
  await page.goto("/cook/dal-tadka");
  await page.getByRole("button", { name: "Start cooking" }).click();
  await page.getByRole("button", { name: "Ask about this step" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "How do I know it is done?" }).click();
  // the sheet itself: the page behind its dimmed backdrop is not meant to be read at that moment
  const r = await new AxeBuilder({ page }).include("[role=dialog]").withRules(["color-contrast"]).analyze();
  expect(r.violations.flatMap((v) => v.nodes.map((n) => n.target.join(" ")))).toEqual([]);
});
