import { lastNDays } from "@/domain/nutrition";
import type { DashboardData, DashboardRepository, DayNutrition } from "@/domain/dashboard";

/** FAKE DATA. Fixed demo numbers so the whole dashboard can be seen before real logging exists. Swap for a real repository later. */
const WEEK_EATEN = [1910, 1850, 2100, 1720, 1980, 1760, 1420];
const WEEK_PLAN = [1900, 1900, 2000, 1850, 2000, 1900, 1900];

export class DemoDashboardRepository implements DashboardRepository {
  constructor(private today: Date = new Date()) {}

  async get(): Promise<DashboardData> {
    const dates = lastNDays(30, this.today);
    const early = Array.from({ length: 23 }, (_, i) => Math.min(2400, Math.round(1850 + 260 * Math.sin(i * 0.8) + 130 * Math.cos(i * 1.9))));
    const eaten = [...early, ...WEEK_EATEN];
    const plan = [...early.map((_, i) => Math.round((1900 + 76 * Math.sin(i * 0.6)) / 10) * 10), ...WEEK_PLAN];

    const days: DayNutrition[] = eaten.map((kcal, i) => {
      const last = i === eaten.length - 1;
      const p = last ? 0.24 : 0.22 + 0.04 * Math.sin(i * 1.3);
      const f = last ? 0.31 : 0.3 + 0.04 * Math.cos(i * 0.9);
      const c = 1 - p - f;
      return {
        date: dates[i],
        planned: plan[i],
        eaten: kcal,
        macros: { protein: Math.round((kcal * p) / 4), carbs: Math.round((kcal * c) / 4), fat: Math.round((kcal * f) / 9) },
      };
    });
    return {
      goals: { calories: 1900, protein: 105, carbs: 230, fat: 60 },
      days,
      eatenToday: ["Breakfast"],
      history: { "oats-banana": 6, "dal-rice": 5, "yogurt-banana": 4, "dal-tadka": 4, omelette: 3, khichdi: 3, "palak-paneer": 2, rajma: 1 },
    };
  }
}
