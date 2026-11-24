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
      const title = isToday ? "Today" : fmtDate(d.date);
      const axis = range === "7d" ? fmtDow(d.date) : fmtDate(d.date);
      // An unlogged past day is a gap in the chart, never zero. Today always counts, even at 0.
      const eaten = isToday ? (d.eaten ?? 0) : d.eaten;
      if (eaten === null) {
        return { axis, title, eaten: null, planned: d.planned, bands: [null, null, null] as [null, null, null], lines: ["Not logged"], footer: `Planned ${num(d.planned)} kcal`, summary: `${title}, not logged` };
      }
      const top = Math.min(eaten, CHART_MAX);
      return {
        axis,
        title,
        eaten,
        planned: d.planned,
        bands: [top * p, top * c, top * f] as [number, number, number],
        lines: [
          `Eaten ${num(eaten)} kcal`,
          `Planned ${num(d.planned)} kcal`,
          `Protein ${d.macros.protein} g`,
          `Carbs ${d.macros.carbs} g`,
          `Fats ${d.macros.fat} g`,
        ],
        footer: isToday
          ? `${num(leftKcal(d.planned, eaten))} kcal left today`
          : `${eaten - d.planned >= 0 ? "+" : "-"}${num(Math.abs(eaten - d.planned))} kcal vs plan`,
        summary: `${title}, eaten ${num(eaten)} kcal, planned ${num(d.planned)} kcal`,
      };
    }),
    aria: `Calories and macros for the ${range === "7d" ? "last 7" : "last 30"} days. ${stats.pastDays ? `Average eaten ${num(stats.avgEaten)} kcal against ${num(stats.avgPlanned)} planned.` : "No earlier days logged yet."}`,
    /** False for a new account: nothing logged before today, so the chart shows a first-day note instead of a history. */
    hasHistory: stats.pastDays > 0,
  };
}
export type ChartModel = ReturnType<typeof buildChartModel>;
