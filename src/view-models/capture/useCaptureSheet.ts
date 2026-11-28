"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseIntent } from "@/domain/capture";
import type { ParsedItem } from "@/domain/pantry";
import { useHome } from "../home/useHome";
import { usePantry } from "../pantry/usePantry";
import { useSpeech } from "../pantry/useSpeech";
import { usePantryScanner } from "../photo/PhotoDeps";
import { useCapture } from "./store";
import { useCamera } from "./useCamera";

export type Tab = "camera" | "voice";
export type CamMode = "meal" | "pantry" | "receipt";

const HINT: Record<CamMode, string> = {
  meal: "Point at your plate to estimate calories",
  pantry: "Point at a shelf or the fridge to update your pantry",
  receipt: "Scan a grocery receipt to add everything at once",
};

/** The camera-or-voice sheet. Meal photos estimate calories; shelf and receipt photos fill the pantry (needs an account: the vision model sits behind an edge function). */
export function useCaptureSheet() {
  const router = useRouter();
  const { sheetOpen, closeSheet, setImage, clearImage } = useCapture();
  const [tab, setTab] = useState<Tab>("camera");
  const [mode, setMode] = useState<CamMode>("meal");
  const cam = useCamera(sheetOpen && tab === "camera");
  const pantry = usePantry();
  const home = useHome();
  const scanner = usePantryScanner();
  const [scanned, setScanned] = useState<{ items: ParsedItem[] } | null>(null);
  const [scanning, setScanning] = useState(false);

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
    } else if (intent.type === "eat") go("/eat");
    else if (intent.type === "suggest") go("/recipes");
    else if (intent.type === "cook") go(home.isLoading || !home.next ? "/recipes" : `/cook/${home.next.id}`);
    else setStatus("I did not catch that. Try one of the examples below.");
  };

  const speech = useSpeech((text) => void handle(text));

  /** Shelf or receipt: read the photo, show what was found, add only when the person agrees. */
  const scan = async (b: Blob | null) => {
    if (!b || !scanner || mode === "meal") return;
    setScanned(null);
    setStatus(null);
    setScanning(true);
    try {
      const items = await scanner.scan(b, mode);
      if (items.length) setScanned({ items });
      else setStatus("I could not find food in that photo. Try again closer.");
    } catch {
      setStatus("I could not read that photo. Try again.");
    } finally {
      setScanning(false);
    }
  };

  const shoot = async () => {
    const b = await cam.capture();
    if (mode !== "meal") return void scan(b);
    setImage(b); // null is fine: the photo screen then shows its demo picture
    go("/photo");
  };

  const fromFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (mode !== "meal") return void scan(file);
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
    setMode: (m: CamMode) => {
      setMode(m);
      setScanned(null);
      setStatus(null);
    },
    /** Shelf and receipt modes need a signed-in account. */
    canScan: !!scanner,
    scanning,
    scanStatus: status,
    scanned: scanned && {
      chips: scanned.items.map((i) => ({ name: i.name[0].toUpperCase() + i.name.slice(1), qty: `+${i.qty}` })),
      add: async () => {
        await pantry.addHeard(scanned.items);
        setScanned(null);
        setStatus("Pantry updated.");
      },
      redo: () => setScanned(null),
    },
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
