import { PantryScreen } from "@/presentation/pantry/PantryScreen";

// Content renders on the client after load, so there is nothing to validate for instant navigation.
export const instant = false;

export default function PantryPage() {
  return <PantryScreen />;
}
