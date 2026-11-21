"use client";
import { create } from "zustand";

interface CaptureState {
  sheetOpen: boolean;
  /** The photo to analyse, as a local object URL. It never leaves the device. */
  imageUrl: string | null;
  blob: Blob | null;
  openSheet: () => void;
  closeSheet: () => void;
  setImage: (blob: Blob | null) => void;
  clearImage: () => void;
}

export const useCapture = create<CaptureState>((set, get) => ({
  sheetOpen: false,
  imageUrl: null,
  blob: null,
  openSheet: () => set({ sheetOpen: true }),
  closeSheet: () => set({ sheetOpen: false }),
  setImage: (blob) => {
    const old = get().imageUrl;
    if (old) URL.revokeObjectURL(old);
    set({ blob, imageUrl: blob ? URL.createObjectURL(blob) : null });
  },
  clearImage: () => {
    const old = get().imageUrl;
    if (old) URL.revokeObjectURL(old);
    set({ blob: null, imageUrl: null });
  },
}));
