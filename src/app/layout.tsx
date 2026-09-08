import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
