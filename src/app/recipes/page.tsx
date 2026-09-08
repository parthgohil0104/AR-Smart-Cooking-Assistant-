import { PlaceholderPage } from "@/components/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipes | AR Smart Cooking Assistant",
  description: "Browse and discover step-by-step AR-guided recipes.",
};

export default function RecipesPage() {
  return (
    <PlaceholderPage
      icon="📖"
      title="Recipes"
      subtitle="Discover AR-guided recipes"
      description="Browse a curated library of recipes, each with QR code access and augmented reality cooking guidance built in."
      comingSoonFeatures={[
        "Recipe library with categories and filters",
        "QR code generation per recipe",
        "Difficulty and time indicators",
        "Ingredient lists with smart substitutions",
        "Save favourites to your dashboard",
      ]}
      ctaLabel="← Back to Home"
      ctaHref="/"
    />
  );
}
