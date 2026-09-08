import { PlaceholderPage } from "@/components/PlaceholderPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant | AR Smart Cooking Assistant",
  description: "Your personal AI-powered culinary coach.",
};

export default function AIPage() {
  return (
    <PlaceholderPage
      icon="🤖"
      title="AI Assistant"
      subtitle="Your personal culinary coach"
      description="Ask cooking questions, request ingredient substitutions, get technique tips, and receive real-time guidance powered by AI."
      comingSoonFeatures={[
        "Natural language recipe Q&A",
        "Smart ingredient substitutions",
        "Technique explanations with visuals",
        "Dietary preference filtering",
        "Voice-activated cooking assistant",
      ]}
      ctaLabel="← Back to Home"
      ctaHref="/"
    />
  );
}
