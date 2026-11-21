"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseIntent } from "@/domain/capture";
import type { ParsedItem } from "@/domain/pantry";
import { useHome } from "../home/useHome";
import { usePantry } from "../pantry/usePantry";
import { useSpeech } from "../pantry/useSpeech";
import { useCapture } from "./store";
import { useCamera } from "./useCamera";

export type Tab = "camera" | "voice";
export type CamMode = "meal" | "pantry" | "receipt";

const HINT: Record<CamMode, string> = {
  meal: "Point at your plate to estimate calories",
  pantry: "Point at a shelf or the fridge to update your pantry",
  receipt: "Scan a grocery receipt to add everything at once",
};

/** The camera-or-voice sheet. Only meal photos work today; shelf and receipt scanning need a vision model. */
export function useCaptureSheet() {
  const router = useRouter();
  const { sheetOpen, closeSheet, setImage, clearImage } = useCapture();
  const [tab, setTab] = useState<Tab>("camera");
  const [mode, setMode] = useState<CamMode>("meal");
  const cam = useCamera(sheetOpen && tab === "camera");
  const pantry = usePantry();
  const home = useHome();

  const [heard, setHeard] = useState<{ text: string; items: ParsedItem[] } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const go = (path: string) => {
    closeSheet();
    router.push(path);
  };

  const handle = async (said: string) => {
    setStatus(null);
    const intent = parseIntent(said);
    if (intent.type === "pantry-add") {
      const items = await pantry.hear(intent.text);
      if (items.length) setHeard({ text: said, items });
      else setStatus("I could not find any food in that. Try again.");
    } else if (intent.type === "suggest") go("/recipes");
    else if (intent.type === "cook") go(home.isLoading || !home.next ? "/recipes" : `/cook/${home.next.id}`);
    else setStatus("I did not catch that. Try one of the examples below.");
  };

  const speech = useSpeech((text) => void handle(text));

  const shoot = async () => {
    const b = await cam.capture();
    setImage(b); // null is fine: the photo screen then shows its demo picture
    go("/photo");
  };

  const fromFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    go("/photo");
  };

  return {
    open: sheetOpen,
    close: closeSheet,
    tab,
    setTab: (t: Tab) => {
      setTab(t);
      setStatus(null);
    },
    mode,
    setMode,
    hint: HINT[mode],
    cam,
    shoot,
    fromFile,
    voice: {
      listening: speech.listening,
      supported: true,
      mic: () => {
        setHeard(null);
        speech.start();
      },
      say: (t: string) => {
        setHeard(null);
        void handle(t);
      },
      status: status ?? (speech.listening ? "Listening" : "Tap the mic and speak"),
      heard: heard && {
        text: heard.text,
        chips: heard.items.map((i) => ({ name: i.name[0].toUpperCase() + i.name.slice(1), qty: `+${i.qty}` })),
        add: async () => {
          await pantry.addHeard(heard.items);
          setStatus("Pantry updated.");
          setHeard(null);
        },
        redo: () => setHeard(null),
      },
    },
    newPhoto: () => clearImage(),
  };
}
export type CaptureSheetModel = ReturnType<typeof useCaptureSheet>;
