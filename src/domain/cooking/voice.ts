export type VoiceCommand = "next" | "prev" | "repeat" | "timer-start" | "timer-pause";

/** Hands are busy while cooking: a few plain phrases, matched loosely. Anything else is ignored. */
export function parseVoiceCommand(text: string): VoiceCommand | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (/\b(start|begin|resume)\b.*\btimer\b|\btimer\b.*\b(start|go|on)\b/.test(t)) return "timer-start";
  if (/\b(pause|stop|cancel)\b.*\btimer\b|\btimer\b.*\b(pause|stop|off)\b/.test(t)) return "timer-pause";
  if (/\b(repeat|again|read|say that|what was that)\b/.test(t)) return "repeat";
  if (/\b(back|previous|go back|last step)\b/.test(t)) return "prev";
  if (/\b(next|done|continue|ok|okay|go on|finished)\b/.test(t)) return "next";
  return null;
}
