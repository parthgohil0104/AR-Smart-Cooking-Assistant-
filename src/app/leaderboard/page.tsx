import { PlaceholderPage } from "@/components/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | AR Smart Cooking Assistant",
  description: "See the top chefs competing on the AR Cooking platform.",
};

export default function LeaderboardPage() {
  return (
    <PlaceholderPage
      icon="🏆"
      title="Leaderboard"
      subtitle="Compete with chefs worldwide"
      description="See where you rank among the community. Earn points by completing recipes, mastering techniques, and hitting cooking streaks."
      comingSoonFeatures={[
        "Global and friends leaderboard",
        "Weekly cooking competitions",
        "Rank tiers (Novice → Master Chef)",
        "Live score updates",
        "Regional leaderboards",
      ]}
      ctaLabel="View Dashboard"
      ctaHref="/dashboard"
    />
  );
}
