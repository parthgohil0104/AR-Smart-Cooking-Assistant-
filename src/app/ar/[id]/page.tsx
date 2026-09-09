import { getRecipeById, recipes } from "@/data/recipes";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ARCookingClient } from "./ARCookingClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) return { title: "Recipe Not Found" };
  return {
    title: `AR Mode — ${recipe.name} | AR Smart Cooking Assistant`,
    description: `Cook ${recipe.name} step-by-step with AR guidance.`,
  };
}

export default async function ARCookingPage({ params }: Props) {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) notFound();

  return <ARCookingClient recipe={recipe} />;
}
