import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR Smart Cooking Assistant",
  description:
    "Scan a recipe QR code and receive step-by-step cooking guidance using augmented reality and AI.",
  keywords: ["cooking", "AR", "augmented reality", "AI", "recipes", "smart cooking"],
  openGraph: {
    title: "AR Smart Cooking Assistant",
    description:
      "Scan a recipe QR code and receive step-by-step cooking guidance using augmented reality and AI.",
    type: "website",
  },
};

/**
 * Root layout: provides <html> + <body> ONLY.
 *
 * Navbar and Footer are intentionally NOT rendered here so that the
 * /ar/[id] route can operate as a completely isolated, full-screen
 * experience without any website chrome.
 *
 * All normal website pages are nested inside src/app/(site)/layout.tsx
 * which adds the Navbar and Footer for that route group.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
