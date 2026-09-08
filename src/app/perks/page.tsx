import { PlaceholderPage } from "@/components/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perks | AR Smart Cooking Assistant",
  description: "Unlock exclusive rewards and perks with your cooking points.",
};

export default function PerksPage() {
  return (
    <PlaceholderPage
      icon="🎁"
      title="Perks"
      subtitle="Redeem your cooking rewards"
      description="Use points earned while cooking to unlock exclusive perks — premium recipe packs, AR filters, and real-world discounts."
      comingSoonFeatures={[
        "Points redemption store",
        "Premium recipe pack unlocks",
        "Exclusive AR cooking overlays",
        "Partner discounts and offers",
        "Monthly perk drops",
      ]}
      ctaLabel="View Leaderboard"
      ctaHref="/leaderboard"
    />
  );
}
