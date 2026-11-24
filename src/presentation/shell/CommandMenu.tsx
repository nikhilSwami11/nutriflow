"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** The screens the menu jumps to. Extra words so "groceries" finds Shopping and "hungry" finds What to eat. */
const PLACES = [
  { href: "/", label: "Today", words: "home feed dashboard" },
  { href: "/eat", label: "What to eat", words: "hungry suggest meal food" },
  { href: "/recipes", label: "Recipes", words: "saved cook" },
  { href: "/plan", label: "Plan", words: "week meals" },
  { href: "/pantry", label: "Pantry", words: "kitchen stock have" },
  { href: "/shopping", label: "Shopping", words: "groceries list buy store" },
  { href: "/chores", label: "Chores", words: "tasks clean" },
  { href: "/profile", label: "Profile", words: "account diet calories settings sign" },
];

const noop = () => () => {};
/** "⌘K" on Apple devices, "Ctrl K" elsewhere. */
export function useShortcutLabel() {
  return useSyncExternalStore(noop, () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K"), () => "⌘K");
}

const OPEN_EVENT = "nutriflow:command-menu";
/** Opens the menu from a button (the sidebar's Go to). */
export const openCommandMenu = () => document.dispatchEvent(new Event(OPEN_EVENT));

/** Cmd+K (Ctrl+K): type to find a screen, arrows to move, Enter to go, Escape to close. */
export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const back = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = () => {
      back.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setActive(0);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      } else if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener(OPEN_EVENT, show);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener(OPEN_EVENT, show);
    };
  }, [open]);
  // Focus goes back where it was when the menu closes.
  useEffect(() => {
    if (!open) back.current?.focus?.();
  }, [open]);

  if (!open) return null;
  const q = query.trim().toLowerCase();
  const shown = PLACES.filter((p) => !q || `${p.label} ${p.words}`.toLowerCase().includes(q));
  const at = Math.min(active, Math.max(0, shown.length - 1));
  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((at + 1) % Math.max(1, shown.length));
    else if (e.key === "ArrowUp") setActive((at - 1 + shown.length) % Math.max(1, shown.length));
    else if (e.key === "Enter" && shown[at]) go(shown[at].href);
    else return;
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-5 pt-[12vh]">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/30" />
      <div role="dialog" aria-modal="true" aria-label="Go to" className="story-in relative flex w-full max-w-[460px] flex-col overflow-hidden rounded-[20px] border border-line bg-bg">
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="command-list"
          aria-activedescendant={shown[at] ? `command-${shown[at].href}` : undefined}
          aria-label="Go to a screen"
          placeholder="Go to…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
          className="min-h-14 border-0 border-b border-line bg-transparent px-5 text-[15px] text-ink outline-none placeholder:text-muted"
        />
        <ul id="command-list" role="listbox" aria-label="Screens" className="m-0 flex max-h-[50vh] list-none flex-col overflow-y-auto p-2">
          {shown.map((p, i) => (
            <li
              key={p.href}
              id={`command-${p.href}`}
              role="option"
              aria-selected={i === at}
              onMouseMove={() => setActive(i)}
              onClick={() => go(p.href)}
              className={`flex min-h-11 cursor-pointer items-center justify-between rounded-2xl px-3.5 text-[15px] ${i === at ? "bg-mint text-onp" : "text-ink"}`}
            >
              {p.label}
              {i === at && <kbd aria-hidden="true" className="font-sans text-xs text-onp">↵</kbd>}
            </li>
          ))}
          {!shown.length && <li className="px-3.5 py-3 text-sm text-ink2">No screen called “{query}”</li>}
        </ul>
        <p className="m-0 flex gap-4 border-t border-line px-5 py-2.5 text-xs text-muted">
          <span><kbd className="font-sans">↑↓</kbd> move</span>
          <span><kbd className="font-sans">↵</kbd> open</span>
          <span><kbd className="font-sans">esc</kbd> close</span>
        </p>
      </div>
    </div>
  );
}

/** The sidebar's way in, with the shortcut shown so people learn it. */
export function GoToButton() {
  const key = useShortcutLabel();
  return (
    <button type="button" onClick={openCommandMenu} aria-keyshortcuts="Meta+K Control+K" className="flex min-h-11 items-center justify-between rounded-2xl border border-line bg-transparent px-3.5 text-sm text-ink2">
      Go to…
      <kbd className="rounded-full bg-track px-2 py-0.5 font-sans text-xs text-ink2">{key}</kbd>
    </button>
  );
}
