import Link from "next/link";

const icon = (d: React.ReactNode) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const cls = "flex h-12 w-[52px] items-center justify-center";

export function BottomNav({ current }: { current: "home" | "pantry" }) {
  return (
    <nav aria-label="Main" className="flex shrink-0 items-center justify-between lg:hidden border-t border-line bg-bg px-5 pb-[22px] pt-1.5">
      <Link href="/" aria-label="Home" aria-current={current === "home" ? "page" : undefined} className={`${cls} ${current === "home" ? "text-ink" : "text-ink2"}`}>{icon(<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />)}</Link>
      <a href="#" aria-label="Recipes" className={`${cls} text-ink2`}>{icon(<><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M9 9h6M9 13h4" /></>)}</a>
      <button type="button" aria-label="Open camera or voice" className="-mt-3.5 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-ink p-0 text-bg">
        {icon(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>)}
      </button>
      <Link href="/pantry" aria-label="Pantry" aria-current={current === "pantry" ? "page" : undefined} className={`${cls} ${current === "pantry" ? "text-ink" : "text-ink2"}`}>{icon(<><rect x="6" y="8" width="12" height="13" rx="3" /><path d="M8 4h8v4H8z" /></>)}</Link>
      <a href="#" aria-label="Profile" className={`${cls} text-ink2`}>{icon(<><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></>)}</a>
    </nav>
  );
}
