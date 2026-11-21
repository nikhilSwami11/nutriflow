import { chartStats, leftKcal, macroShares, type DayNutrition } from "@/domain/dashboard";

/** Top of the chart's y axis, kcal. */
export const CHART_MAX = 2400;
export type Range = "7d" | "30d";

export const num = (n: number) => n.toLocaleString("en-US");
const parse = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
};
export const fmtDate = (d: string) => parse(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtDow = (d: string) => parse(d).toLocaleDateString("en-US", { weekday: "short" });
export const fmtDowLong = (d: string) => parse(d).toLocaleDateString("en-US", { weekday: "long" });

/** One pre-formatted entry per day: the chart only draws. The last day is today. */
export function buildChartModel(days: DayNutrition[], range: Range) {
  const n = days.length;
  const stats = chartStats(days);
  return {
    title: `Calories and macros, ${range === "7d" ? "last 7 days" : "last 30 days"}`,
    points: days.map((d, i) => {
      const isToday = i === n - 1;
      const [p, c, f] = macroShares(d.macros);
      const top = Math.min(d.eaten, CHART_MAX);
      return {
        axis: range === "7d" ? fmtDow(d.date) : fmtDate(d.date),
        title: isToday ? "Today" : fmtDate(d.date),
        eaten: d.eaten,
        planned: d.planned,
        bands: [top * p, top * c, top * f] as [number, number, number],
        lines: [
          `Eaten ${num(d.eaten)} kcal`,
          `Planned ${num(d.planned)} kcal`,
          `Protein ${d.macros.protein} g`,
          `Carbs ${d.macros.carbs} g`,
          `Fats ${d.macros.fat} g`,
        ],
        footer: isToday
          ? `${num(leftKcal(d.planned, d.eaten))} kcal left today`
          : `${d.eaten - d.planned >= 0 ? "+" : "-"}${num(Math.abs(d.eaten - d.planned))} kcal vs plan`,
        summary: `${isToday ? "Today" : fmtDate(d.date)}, eaten ${num(d.eaten)} kcal, planned ${num(d.planned)} kcal`,
      };
    }),
    aria: `Calories and macros for the ${range === "7d" ? "last 7" : "last 30"} days. Average eaten ${num(stats.avgEaten)} kcal against ${num(stats.avgPlanned)} planned.`,
  };
}
export type ChartModel = ReturnType<typeof buildChartModel>;
