"use client";
import { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** Counts from the previous value to the new one. Jumps straight there under reduced motion. */
export function AnimatedNumber({ value, format = (n) => n.toLocaleString("en-US"), ms = 600 }: { value: number; format?: (n: number) => string; ms?: number }) {
  const [shown, setShown] = useState(reduced() ? value : 0);
  const from = useRef(shown);

  useEffect(() => {
    if (reduced()) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      const v = a + (value - a) * ease(t);
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);

  return <>{format(Math.round(shown))}</>;
}
