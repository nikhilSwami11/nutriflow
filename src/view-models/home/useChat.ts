"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { chatTurn, type ChatMessage } from "@/domain/assistant";
import { parseIntent } from "@/domain/capture";
import { toDateKey } from "@/domain/nutrition";
import type { ParsedItem } from "@/domain/pantry";
import { usePantry } from "../pantry/usePantry";
import { useSpeech } from "../pantry/useSpeech";
import { useChatDeps } from "./ChatDeps";

export const CHAT_CHIPS = ["What should I eat?", "Start cooking", "What can I make?", "I have eggs and rice"];
const HELP = "I can pick what to eat, start your next meal, show what you can make, or add food you have. Try “I have eggs and rice”.";

export type Msg = {
  id: number;
  from: "me" | "bot";
  text: string;
  go?: { label: string; href: string };
  heard?: { chips: { name: string; qty: string }[]; items: ParsedItem[]; state: "open" | "added" | "skipped" };
};

// The model can take several tool rounds; past this the rule router answers instead.
const TIMEOUT_MS = 20_000;

type Used = { name: string; result: unknown }[];
/** One tap after a model answer, from the last tool that ran. */
function buttonFor(used: Used): Msg["go"] {
  const last = used.at(-1);
  if (!last) return undefined;
  const r = last.result as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (last.name) {
    case "eat_next":
      if (!r?.next) return undefined;
      return r.canCook ? { label: "Start cooking", href: `/cook/${r.next.recipeId}` } : { label: "See recipe", href: `/recipes/${r.next.recipeId}` };
    case "what_to_eat":
      return r?.best?.id ? { label: "See recipe", href: `/recipes/${r.best.id}` } : undefined;
    case "recipe":
      return r?.id ? { label: "See recipe", href: `/recipes/${r.id}` } : undefined;
    case "find_recipes":
      return { label: "See recipes", href: "/recipes" };
    case "week_plan":
      return { label: "See plan", href: "/plan" };
    case "pantry":
    case "add_to_pantry":
      return { label: "Open pantry", href: "/pantry" };
    case "shopping_list":
    case "add_to_shopping_list":
    case "mark_bought":
      return { label: "Open shopping", href: "/shopping" };
    case "chores_today":
    case "set_chore_done":
      return { label: "Open chores", href: "/chores" };
  }
  return undefined;
}

/** The Home chat. The model answers through the app's own tools when Supabase is set; otherwise, or when it fails, the rule router the capture sheet uses. */
export function useChat(next: { id: string; name: string } | undefined) {
  const router = useRouter();
  const pantry = usePantry();
  const { brain, tools } = useChatDeps();
  const queries = useQueryClient();
  const history = useRef<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const n = useRef(0);
  const push = (m: Omit<Msg, "id">) => setMsgs((l) => [...l, { ...m, id: ++n.current }]);

  const send = async (said: string) => {
    const t = said.trim();
    if (!t) return;
    setText("");
    push({ from: "me", text: t });
    if (brain) {
      setBusy(true);
      try {
        const turn = await Promise.race([
          chatTurn(brain, tools, history.current, t, { date: toDateKey(new Date()), hour: new Date().getHours() }),
          new Promise<never>((_, no) => setTimeout(() => no(new Error("timeout")), TIMEOUT_MS)),
        ]);
        history.current = turn.history;
        push({ from: "bot", text: turn.text, go: buttonFor(turn.used) });
        // Tools may have logged a meal or changed the pantry: let every screen read fresh data.
        if (turn.used.length) void queries.invalidateQueries();
        return;
      } catch {
        // Fall through to the rules: the chat never leaves a line unanswered.
      } finally {
        setBusy(false);
      }
    }
    const intent = parseIntent(t);
    if (intent.type === "eat") push({ from: "bot", text: "Let’s find you something. I’ll look at your pantry and what is left in your day.", go: { label: "Pick my meal", href: "/eat" } });
    else if (intent.type === "suggest") push({ from: "bot", text: "Here is what your recipes offer.", go: { label: "See recipes", href: "/recipes" } });
    else if (intent.type === "cook") {
      if (next) push({ from: "bot", text: `Next up is ${next.name}.`, go: { label: "Start cooking", href: `/cook/${next.id}` } });
      else push({ from: "bot", text: "Nothing is left to cook today.", go: { label: "See recipes", href: "/recipes" } });
    } else if (intent.type === "pantry-add") {
      setBusy(true);
      const items = await pantry.hear(intent.text).catch(() => []);
      setBusy(false);
      if (items.length) push({ from: "bot", text: "I heard this. Add it to your pantry?", heard: { items, state: "open", chips: items.map((i) => ({ name: i.name[0].toUpperCase() + i.name.slice(1), qty: `+${i.qty}` })) } });
      else push({ from: "bot", text: "I could not find any food in that. Try again." });
    } else push({ from: "bot", text: HELP });
  };

  const speech = useSpeech((t) => void send(t));
  const settle = (id: number, state: "added" | "skipped") => setMsgs((l) => l.map((m) => (m.id === id && m.heard ? { ...m, heard: { ...m.heard, state } } : m)));

  return {
    open,
    setOpen,
    text,
    setText,
    msgs,
    busy,
    listening: speech.listening,
    mic: speech.start,
    send,
    go: (href: string) => { setOpen(false); router.push(href); },
    add: async (m: Msg) => {
      if (!m.heard) return;
      await pantry.addHeard(m.heard.items);
      settle(m.id, "added");
      push({ from: "bot", text: "Pantry updated." });
    },
    skip: (m: Msg) => settle(m.id, "skipped"),
    hour: new Date().getHours(),
  };
}
export type ChatModel = ReturnType<typeof useChat>;
