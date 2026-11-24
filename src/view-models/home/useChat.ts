"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { parseIntent } from "@/domain/capture";
import type { ParsedItem } from "@/domain/pantry";
import { usePantry } from "../pantry/usePantry";
import { useSpeech } from "../pantry/useSpeech";

export const CHAT_CHIPS = ["What should I eat?", "Start cooking", "What can I make?", "I have eggs and rice"];
const HELP = "I can pick what to eat, start your next meal, show what you can make, or add food you have. Try “I have eggs and rice”.";

export type Msg = {
  id: number;
  from: "me" | "bot";
  text: string;
  go?: { label: string; href: string };
  heard?: { chips: { name: string; qty: string }[]; items: ParsedItem[]; state: "open" | "added" | "skipped" };
};

/** The Home chat. Not a model yet: each line goes through the rule router the capture sheet uses, and the reply offers one tap. */
export function useChat(next: { id: string; name: string } | undefined) {
  const router = useRouter();
  const pantry = usePantry();
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
