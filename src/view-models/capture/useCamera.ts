"use client";
import { useCallback, useEffect, useState } from "react";

export type CameraState = "starting" | "live" | "denied" | "unsupported";

/** The phone's camera for the sheet. Stops every track when the sheet closes, so the camera light goes off. */
export function useCamera(active: boolean) {
  const [video, attach] = useState<HTMLVideoElement | null>(null); // a callback ref: set when the <video> mounts
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [state, setState] = useState<CameraState>("starting");

  useEffect(() => {
    if (!active) return;
    const md = navigator.mediaDevices;
    if (!md?.getUserMedia) {
      // asynchronous so the effect does not set state synchronously
      void Promise.resolve().then(() => setState("unsupported"));
      return;
    }
    let stream: MediaStream | null = null;
    let cancelled = false;
    void Promise.resolve().then(() => setState("starting"));
    md.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video) {
          video.srcObject = s;
          void video.play().catch(() => undefined);
        }
        setState("live");
      })
      .catch(() => !cancelled && setState("denied"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, facing, video]);

  /** The current frame as a JPEG, or null when there is no live picture. */
  const capture = useCallback(async (): Promise<Blob | null> => {
    const v = video;
    if (!v || state !== "live" || !v.videoWidth) return null;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    return new Promise((res) => c.toBlob((b) => res(b), "image/jpeg", 0.85));
  }, [state, video]);

  return { attach, state, flip: () => setFacing((f) => (f === "environment" ? "user" : "environment")), capture };
}
