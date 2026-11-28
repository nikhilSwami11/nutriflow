import { SuggestedScreen } from "@/presentation/eat/SuggestedScreen";

// Content renders on the client after load, so there is nothing to validate for instant navigation.
export const instant = false;

export default function EatPage() {
  return <SuggestedScreen />;
}
