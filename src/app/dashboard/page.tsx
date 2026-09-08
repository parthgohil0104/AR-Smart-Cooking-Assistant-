import { PlaceholderPage } from "@/components/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | AR Smart Cooking Assistant",
  description: "Track your cooking progress, points, and achievements.",
};

export default function DashboardPage() {
  return (
    <PlaceholderPage
      icon="📊"
      title="Dashboard"
      subtitle="Track your culinary journey"
      description="View your cooking history, earned points, unlocked achievements, and personalised recipe recommendations."
      comingSoonFeatures={[
        "Cooking activity history",
        "Points and XP tracking",
        "Achievement badges",
        "Personalised recipe recommendations",
        "Weekly cooking streaks",
      ]}
      ctaLabel="← Back to Home"
      ctaHref="/"
    />
  );
}
