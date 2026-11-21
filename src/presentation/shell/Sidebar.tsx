import Link from "next/link";
import type { Page } from "./pages";

const icon = (d: React.ReactNode) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const item = "flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-sm min-h-11";
const on = "bg-track font-medium text-ink";
const off = "font-normal text-ink2";

export function Sidebar({ current }: { current: Page }) {
  return (
    <nav aria-label="Main" className="hidden w-[232px] shrink-0 flex-col gap-7 self-start rounded-3xl border border-line bg-bg px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-3 text-xl font-semibold tracking-[-0.01em]">
        <span className="block h-3 w-3 rounded-full bg-ink" />
        <span>NutriFlow</span>
      </div>
      <div className="flex flex-col gap-1">
        <Link href="/" aria-current={current === "home" ? "page" : undefined} className={`${item} ${current === "home" ? on : off}`}>
          {icon(<path d="M3 11l9-8 9 8M5 10v10h14V10" />)}Today
        </Link>
        <Link href="/pantry" aria-current={current === "pantry" ? "page" : undefined} className={`${item} ${current === "pantry" ? on : off}`}>
          {icon(<><rect x="6" y="8" width="12" height="13" rx="3" /><path d="M8 4h8v4H8z" /></>)}Pantry
        </Link>
        <Link href="/recipes" aria-current={current === "recipes" ? "page" : undefined} className={`${item} ${current === "recipes" ? on : off}`}>
          {icon(<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6zM2 10h20M9 6c0-1.5 1-2 1-3M14 6c0-1.5 1-2 1-3" />)}Recipes
        </Link>
        <Link href="/plan" aria-current={current === "plan" ? "page" : undefined} className={`${item} ${current === "plan" ? on : off}`}>
          {icon(<><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></>)}Plan
        </Link>
      </div>
    </nav>
  );
}
