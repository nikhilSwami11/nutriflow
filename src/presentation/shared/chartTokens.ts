/** Chart.js draws on canvas, so it can't read CSS variables. Resolve them once when the chart mounts. */
export function readChartTokens() {
  const root = getComputedStyle(document.documentElement);
  const v = (n: string) => root.getPropertyValue(n).trim();
  return {
    font: getComputedStyle(document.body).fontFamily,
    bg: v("--bg"),
    ink: v("--ink"),
    ink2: v("--ink2"),
    muted: v("--muted"),
    line: v("--line"),
    line2: v("--line2"),
    rose: v("--rose"),
    sky: v("--sky"),
    lavender: v("--lavender"),
  };
}
export type ChartTokens = ReturnType<typeof readChartTokens>;

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;
