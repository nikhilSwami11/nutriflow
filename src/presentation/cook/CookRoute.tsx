"use client";
import { useSearchParams } from "next/navigation";
import { CookScreen } from "./CookScreen";

/** `?servings=6` carries the servings picked on the recipe page. */
export function CookRoute({ id }: { id: string }) {
  const raw = Number(useSearchParams().get("servings"));
  return <CookScreen id={id} servings={raw > 0 && raw <= 24 ? raw : undefined} />;
}
