import { PlaceholderPage } from "@/components/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan Recipe | AR Smart Cooking Assistant",
  description: "Scan a recipe QR code to start AR-guided cooking.",
};

export default function ScanPage() {
  return (
    <PlaceholderPage
      icon="📷"
      title="Scan Recipe"
      subtitle="Point. Scan. Start cooking."
      description="Use your device camera to scan a recipe QR code. The app will instantly load ingredients, steps, and AR guidance."
      comingSoonFeatures={[
        "Camera QR code scanner",
        "Instant recipe loading from QR",
        "Offline-capable recipe cache",
        "Shareable recipe QR codes",
      ]}
      ctaLabel="Explore Recipes"
      ctaHref="/recipes"
    />
  );
}
