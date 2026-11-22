"use client";
import { useCallback, useEffect, useRef } from "react";
import { useCapture } from "@/view-models/capture/store";
import { useCaptureSheet, type CamMode } from "@/view-models/capture/useCaptureSheet";
import { Orb } from "../pantry/Orb";

const MODES: { id: CamMode; label: string; ready: boolean }[] = [
  { id: "meal", label: "Meal", ready: true },
  { id: "pantry", label: "Pantry shelf", ready: false },
  { id: "receipt", label: "Receipt", ready: false },
];
const EXAMPLES = ["I have 3 onions, 2 tomatoes and butter", "What can I make tonight?", "Start cooking"];
const tab = (on: boolean) => `min-h-11 rounded-full px-4 text-sm ${on ? "bg-bg font-medium text-ink shadow-[0_1px_5px_rgba(0,0,0,0.10)]" : "text-ink2"}`;
const corner = "absolute h-7 w-7 border-ink";

function Body() {
  const s = useCaptureSheet();
  const attach = s.cam.attach; // stable setState, so the ref does not churn each render
  const setVideo = useCallback((el: HTMLVideoElement | null) => attach(el), [attach]);
  const file = useRef<HTMLInputElement>(null);
  const { close } = s;
  // On the document, not the sheet: focus can fall to the page when a focused button disappears (after Add to pantry).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={s.close} className="absolute inset-0 bg-black/30" />
      <div role="dialog" aria-modal="true" aria-label="Camera or voice" className="story-in relative mx-auto flex w-full max-w-[460px] flex-col gap-4 rounded-t-[28px] bg-bg px-5 pb-[max(30px,env(safe-area-inset-bottom))] pt-2.5">
        <span className="mx-auto block h-1 w-10 rounded-sm bg-line2" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3">
          <div role="group" aria-label="Mode" className="flex gap-0.5 rounded-full bg-track p-[3px]">
            <button type="button" aria-pressed={s.tab === "camera"} onClick={() => s.setTab("camera")} className={tab(s.tab === "camera")}>Camera</button>
            <button type="button" aria-pressed={s.tab === "voice"} onClick={() => s.setTab("voice")} className={tab(s.tab === "voice")}>Voice</button>
          </div>
          <button type="button" autoFocus onClick={s.close} aria-label="Close sheet" className="flex h-11 w-11 items-center justify-center rounded-full bg-track">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {s.tab === "camera" ? (
          <>
            <div className="relative flex h-[280px] items-center justify-center overflow-hidden rounded-3xl bg-track">
              <video ref={setVideo} playsInline muted aria-label="Camera preview" className={`absolute inset-0 h-full w-full object-cover ${s.cam.state === "live" ? "" : "hidden"}`} />
              <span aria-hidden="true" className={`${corner} left-[18px] top-[18px] rounded-tl-lg border-l-2 border-t-2`} />
              <span aria-hidden="true" className={`${corner} right-[18px] top-[18px] rounded-tr-lg border-r-2 border-t-2`} />
              <span aria-hidden="true" className={`${corner} bottom-[18px] left-[18px] rounded-bl-lg border-b-2 border-l-2`} />
              <span aria-hidden="true" className={`${corner} bottom-[18px] right-[18px] rounded-br-lg border-b-2 border-r-2`} />
              {s.cam.state !== "live" && (
                <span className="max-w-[240px] text-center text-sm leading-normal text-ink2">
                  {s.cam.state === "denied" || s.cam.state === "unsupported" ? "The camera is not available. Choose a photo instead." : s.hint}
                </span>
              )}
              {s.cam.state === "live" && <span className="absolute inset-x-0 bottom-3 text-center"><span className="rounded-full bg-white/85 px-3 py-1 text-xs text-onp">{s.hint}</span></span>}
            </div>
            <div role="group" aria-label="What to scan" className="flex flex-wrap justify-center gap-2">
              {MODES.map((m) => (
                <button key={m.id} type="button" aria-pressed={s.mode === m.id} disabled={!m.ready} onClick={() => s.setMode(m.id)} title={m.ready ? undefined : "Needs photo recognition, which is not connected yet"} className={`touch rounded-full border px-4 text-sm ${s.mode === m.id ? "border-transparent bg-mint text-onp" : "border-line2 text-ink"} disabled:opacity-40`}>{m.label}</button>
              ))}
            </div>
            <div className="flex items-center justify-between px-3">
              <input ref={file} type="file" accept="image/*" className="sr-only" aria-label="Photo file" tabIndex={-1} onChange={(e) => s.fromFile(e.target.files?.[0])} />
              <button type="button" aria-label="Choose from photos" onClick={() => file.current?.click()} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line2 bg-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M4 16l5-5 4 4 3-3 4 4" /></svg>
              </button>
              <button type="button" onClick={() => void s.shoot()} aria-label="Take photo" className="h-[72px] w-[72px] rounded-full border-2 border-ink bg-bg p-[5px]"><span className="block h-full w-full rounded-full bg-ink" /></button>
              <button type="button" aria-label="Flip camera" onClick={s.cam.flip} className="flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4" /></svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="relative flex h-[216px] items-center justify-center rounded-3xl bg-panel">
              <button type="button" onClick={s.voice.mic} aria-pressed={s.voice.listening} aria-label={s.voice.listening ? "Stop listening" : "Start listening"} className="relative flex h-[76px] w-[76px] items-center justify-center rounded-full bg-ink p-0 text-bg">
                <Orb active={s.voice.listening} />
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              </button>
              <span role="status" className="absolute inset-x-0 bottom-3.5 text-center text-sm text-ink2">{s.voice.status}</span>
            </div>
            {s.voice.heard && (
              <div className="flex flex-col gap-3 rounded-[20px] border border-line p-4">
                <p className="m-0 text-sm text-ink2">&ldquo;{s.voice.heard.text}&rdquo;</p>
                <div className="flex flex-wrap gap-2">
                  {s.voice.heard.chips.map((c) => <span key={c.name} className="rounded-full border border-line2 px-3.5 py-[7px] text-sm"><span className="font-medium">{c.name}</span> <span className="text-muted">{c.qty}</span></span>)}
                </div>
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => void s.voice.heard?.add()} className="min-h-12 flex-1 rounded-full bg-ink text-sm font-medium text-bg">Add to pantry</button>
                  <button type="button" onClick={s.voice.heard.redo} className="min-h-12 rounded-full border border-line2 px-[18px] text-sm">Redo</button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">Try saying</span>
              {EXAMPLES.map((t) => (
                <button key={t} type="button" onClick={() => s.voice.say(t)} className="hoverable touch rounded-2xl border border-line2 bg-bg px-4 py-3 text-left text-sm">{t}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CaptureSheet() {
  const open = useCapture((s) => s.sheetOpen);
  return open ? <Body /> : null;
}
