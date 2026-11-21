import { HomeScreen } from "@/presentation/home/HomeScreen";

// Content renders on the client after load, so there is nothing to validate for instant navigation.
export const instant = false;

export default function Home() {
  return <HomeScreen />;
}
