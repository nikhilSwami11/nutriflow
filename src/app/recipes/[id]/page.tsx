import { notFound } from "next/navigation";
import { RECIPE_IDS } from "@/composition/recipeIds";
import { RecipeDetailScreen } from "@/presentation/recipes/RecipeDetailScreen";

export function generateStaticParams() {
  return RECIPE_IDS.map((id) => ({ id }));
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!RECIPE_IDS.includes(id)) notFound();
  return <RecipeDetailScreen id={id} />;
}
