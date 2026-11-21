import type { DetectedItem, Detection, MealDetector } from "@/domain/photo";

/**
 * DEMO DETECTOR. Photo recognition is not connected yet, so this does not look at the photo:
 * it returns the example from the design. The screen says so. Replace with a model behind the same port.
 */
export class DemoMealDetector implements MealDetector {
  async detect(): Promise<Detection> {
    await new Promise((r) => setTimeout(r, 700)); // long enough to see the scan, short enough not to annoy
    return {
      source: "demo",
      dish: "Dal tadka with rice",
      recipeId: "dal-tadka",
      confidence: 92,
      items: [
        { id: "dal", name: "Dal tadka", confidence: 94, amount: 1.3, step: 0.25, unit: "cups", kcalPer: 230, protein: 12, carbs: 33, fat: 6, color: "#9EC8F3", box: { x: 0.236, y: 0.355, w: 0.528, h: 0.294 }, pantryName: "Toor dal", reason: "Matches the lentils in your pantry" },
        { id: "rice", name: "Rice", confidence: 88, amount: 0.75, step: 0.25, unit: "cup", kcalPer: 205, protein: 4.3, carbs: 45, fat: 0.4, color: "#F2A3A9", box: { x: 0.103, y: 0.621, w: 0.303, h: 0.156 }, pantryName: "Basmati rice", reason: "Rice goes with dal in your recent meals" },
        { id: "ghee", name: "Ghee", confidence: 61, amount: 1, step: 0.5, unit: "tbsp", kcalPer: 120, protein: 0, carbs: 0, fat: 13.5, color: "#B9A7EE", box: { x: 0.595, y: 0.28, w: 0.2, h: 0.123 }, pantryName: "Ghee", reason: "Ghee is a guess from the recipe, since oil is hard to see in a photo" },
      ] satisfies DetectedItem[],
    };
  }
}
