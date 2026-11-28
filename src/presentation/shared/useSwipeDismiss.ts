"use client";
import { useRef } from "react";
import { useModalFocus } from "./useModalFocus";

/**
 * Drag a bottom sheet down to close it (touch and pen; a mouse uses the Close button or Escape).
 * Spread `handle` on the sheet's top strip and put `sheet` on the sheet. Moves the sheet with the CSS `translate`
 * property, so it does not fight the entrance animation's `transform`. Closes past 100px or on a quick flick.
 */
export function useSwipeDismiss(onClose: () => void) {
  const sheet = useRef<HTMLDivElement>(null);
  useModalFocus(sheet);
  const start = useRef<{ y: number; t: number; dragging: boolean } | null>(null);
  const move = (dy: number, settle: boolean) => {
    const el = sheet.current;
    if (!el) return;
    el.style.transition = settle ? "translate 200ms ease-out" : "none";
    el.style.translate = dy ? `0 ${dy}px` : "";
  };
  const handle = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") start.current = { y: e.clientY, t: e.timeStamp, dragging: false };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const s = start.current;
      if (!s) return;
      const dy = Math.max(0, e.clientY - s.y);
      // Capture only once it is clearly a drag, so a tap on a button in the strip still clicks.
      if (!s.dragging && dy > 8) {
        s.dragging = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      if (s.dragging) move(dy, false);
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s?.dragging) return;
      const dy = e.clientY - s.y;
      if (dy > 100 || dy / Math.max(1, e.timeStamp - s.t) > 0.6) onClose();
      else move(0, true);
    },
    onPointerCancel: () => {
      start.current = null;
      move(0, true);
    },
  };
  return { sheet, handle };
}
