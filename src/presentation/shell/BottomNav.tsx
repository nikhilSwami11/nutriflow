import Link from "next/link";
import { useCapture } from "@/view-models/capture/store";
import { NAV } from "./navItems";
import { SECTION, type Page } from "./pages";

const icon = (d: React.ReactNode) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const cls = "flex h-14 w-16 flex-col items-center justify-center gap-0.5";

export function BottomNav({ current }: { current: Page }) {
  const link = (n: (typeof NAV)[number]) => {
    const on = SECTION[current] === n.section;
    return <Link key={n.section} href={n.href} aria-label={n.label} aria-current={on ? "page" : undefined} className={`${cls} ${on ? "font-medium text-ink" : "text-ink2"}`}>
      <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${on ? "bg-mint text-onp" : ""}`}>{icon(n.icon)}</span>
      <span className="text-xs">{n.label}</span>
    </Link>;
  };
  return (
    <nav aria-label="Main" className="relative z-10 flex shrink-0 items-center justify-between border-t border-line bg-bg px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
      {NAV.slice(0, 2).map(link)}
      <button type="button" aria-label="Open camera or voice" onClick={() => useCapture.getState().openSheet()} className="-mt-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-ink p-0 text-bg ring-[6px] ring-bg">
        {icon(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>)}
      </button>
      {NAV.slice(2).map(link)}
    </nav>
  );
}
