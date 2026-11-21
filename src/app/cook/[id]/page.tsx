import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RECIPE_IDS } from "@/composition/recipeIds";
import { CookRoute } from "@/presentation/cook/CookRoute";

// Content renders on the client after load, so there is nothing to validate for instant navigation.
export const instant = false;

export function generateStaticParams() {
  return RECIPE_IDS.map((id) => ({ id }));
}

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!RECIPE_IDS.includes(id)) notFound();
  return (
    <Suspense fallback={null}>
      <CookRoute id={id} />
    </Suspense>
  );
}
