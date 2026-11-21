import { lastNDays, type MealLog } from "@/domain/nutrition";

/** Dev-only demo logs for the in-memory repository. Real days only: day 4 and 5 ago stay unlogged on purpose. */
export function seedLogs(today: Date): MealLog[] {
  const d = lastNDays(7, today);
  const m = (i: number, slot: MealLog["slot"], name: string, kcal: number): MealLog => ({
    id: `seed-${i}-${slot}`, date: d[i], slot, source: "cook", name, kcal,
  });
  return [
    m(0, "breakfast", "Oats and banana", 340), m(0, "lunch", "Dal rice", 610), m(0, "dinner", "Paneer wrap", 980),
    m(1, "lunch", "Khichdi", 650), m(1, "dinner", "Sabzi roti", 1150),
    m(4, "breakfast", "Poha", 380), m(4, "lunch", "Rajma rice", 720), m(4, "dinner", "Dal tadka", 780),
    m(5, "breakfast", "Oats and banana", 340), m(5, "lunch", "Dal rice", 610), m(5, "dinner", "Palak paneer", 600),
    m(6, "breakfast", "Oats and banana", 340), m(6, "lunch", "Dal rice", 610),
  ];
}
