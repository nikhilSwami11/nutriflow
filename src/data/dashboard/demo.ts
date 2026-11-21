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
    // Today: macros match the demo meals below (1,420 kcal).
    days[days.length - 1].macros = { protein: 84, carbs: 160, fat: 49 };

    return {
      goals: { calories: 1900, protein: 105, carbs: 230, fat: 60 },
      days,
      meals: [
        { name: "Breakfast", slot: "breakfast", planned: 450, eaten: 430 },
        { name: "Lunch", slot: "lunch", planned: 650, eaten: 610 },
        { name: "Snack", slot: "snack", planned: 200, eaten: 380 },
        { name: "Dinner", slot: "dinner", planned: 600, eaten: 0 },
      ],
      tonight: {
        title: "Dal tadka",
        tags: ["From your pantry", "About 480 kcal"],
        blurb: "Fits the 480 kcal you have left. Log it when you eat.",
        kcal: 480,
        macros: { protein: 24, carbs: 60, fat: 16 },
      },
      suggestions: [
        { id: "cook", title: "Cook dal tadka tonight", body: "Uses the tomatoes and onions closest to running out. About 480 kcal, and it covers most of the 32 g of protein you are short on today.", cta: "Start cooking" },
        { id: "snack", title: "Add a protein snack at 4 pm", body: "Your last three afternoons dipped under your protein goal. Greek yogurt with banana closes the gap for about 160 kcal.", cta: "Add to plan" },
        { id: "move", title: "Move dinner earlier", body: "You log meals fastest before 7 pm and skip logging after 8. Cooking at 6:30 keeps tracking complete.", cta: "Shift plan" },
      ],
    };
  }
}
