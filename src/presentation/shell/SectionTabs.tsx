import Link from "next/link";
import { SECTION, SECTION_PAGES, type Page } from "./pages";

/** Switch between the pages of one section (Food: suggested, plan; Kitchen: pantry, shopping). */
export function SectionTabs({ current }: { current: Page }) {
  const section = SECTION[current];
  const pages = SECTION_PAGES[section];
  if (!pages) return null;
  return (
    <nav aria-label={section === "food" ? "Food" : "Kitchen"} className="flex shrink-0 gap-2 overflow-x-auto px-5 pt-3">
      {pages.map((p) => (
        <Link
          key={p.page}
          href={p.href}
          aria-current={p.page === current ? "page" : undefined}
          className={`touch flex shrink-0 items-center rounded-full px-4 text-sm ${p.page === current ? "bg-mint font-medium text-onp" : "border border-line2 text-ink2"}`}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
