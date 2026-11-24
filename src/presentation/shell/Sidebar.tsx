import Link from "next/link";
import { GoToButton } from "./CommandMenu";
import { NAV, PROFILE_ICON } from "./navItems";
import { SECTION, type Page } from "./pages";

const icon = (d: React.ReactNode) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const item = "flex items-center gap-3 rounded-2xl px-3.5 py-[11px] text-sm min-h-11";
const on = "bg-track font-medium text-ink";
const off = "font-normal text-ink2";

export function Sidebar({ current }: { current: Page }) {
  const items = [...NAV, { section: "profile" as const, href: "/profile", label: "Profile", icon: PROFILE_ICON }];
  return (
    <nav aria-label="Main" className="hidden w-[232px] shrink-0 flex-col gap-7 self-start rounded-3xl border border-line bg-bg px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-3 text-xl font-semibold tracking-[-0.01em]">
        <span className="block h-3 w-3 rounded-full bg-ink" />
        <span>NutriFlow</span>
      </div>
      <GoToButton />
      <div className="flex flex-col gap-1">
        {items.map((n) => {
          const active = SECTION[current] === n.section;
          return (
            <Link key={n.section} href={n.href} aria-current={active ? "page" : undefined} className={`${item} ${active ? on : off}`}>
              {icon(n.icon)}
              {n.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
