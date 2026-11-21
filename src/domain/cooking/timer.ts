export interface TimerState {
  totalMs: number;
  /** Milliseconds counted before the last pause. */
  accMs: number;
  /** When it last started running; null when stopped or paused. */
  startedAt: number | null;
}

export const newTimer = (minutes: number): TimerState => ({ totalMs: minutes * 60_000, accMs: 0, startedAt: null });

/** Based on the clock, not on counting ticks, so a throttled background tab stays accurate. */
export const elapsedMs = (t: TimerState, now: number): number => Math.min(t.totalMs, t.accMs + (t.startedAt === null ? 0 : now - t.startedAt));
export const remainingMs = (t: TimerState, now: number): number => t.totalMs - elapsedMs(t, now);
export const isRunning = (t: TimerState): boolean => t.startedAt !== null;
export const isDone = (t: TimerState, now: number): boolean => remainingMs(t, now) <= 0;

export const startTimer = (t: TimerState, now: number): TimerState => (isRunning(t) || isDone(t, now) ? t : { ...t, startedAt: now });
export const pauseTimer = (t: TimerState, now: number): TimerState => (isRunning(t) ? { ...t, accMs: elapsedMs(t, now), startedAt: null } : t);

/** 9:05 style. Rounds up so it reads 0:01 until it is truly done. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
