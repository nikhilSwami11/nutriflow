"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseVoiceCommand, type VoiceCommand } from "@/domain/cooking";

interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type Ctor = new () => Recognition;

const ctor = (): Ctor | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/** Hands-free control while cooking. Off until switched on; listens continuously and restarts if the browser stops it. */
export function useVoiceCommands(onCommand: (c: VoiceCommand) => void) {
  const [on, setOn] = useState(false);
  const [supported] = useState(() => !!ctor());
  const cb = useRef(onCommand);
  useEffect(() => {
    cb.current = onCommand;
  });

  useEffect(() => {
    const C = ctor();
    if (!on || !C) return;
    let stopped = false;
    const r = new C();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const cmd = parseVoiceCommand(e.results[i][0].transcript);
        if (cmd) cb.current(cmd);
      }
    };
    r.onerror = () => undefined;
    r.onend = () => {
      if (!stopped) {
        try {
          r.start();
        } catch {
          /* already started */
        }
      }
    };
    try {
      r.start();
    } catch {
      /* ignore */
    }
    return () => {
      stopped = true;
      r.stop();
    };
  }, [on]);

  return { supported, on, toggle: useCallback(() => setOn((v) => !v), []) };
}

/** Read a step aloud. Does nothing where speech synthesis is missing. */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
