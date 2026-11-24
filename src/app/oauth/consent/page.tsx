import { Suspense } from "react";
import { ConsentScreen } from "@/presentation/auth/ConsentScreen";

export const instant = false;

// Supabase Auth's OAuth 2.1 server sends the browser here (Authorization Path) when ChatGPT or Claude connects.
export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentScreen />
    </Suspense>
  );
}
