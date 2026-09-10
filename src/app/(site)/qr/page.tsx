import type { Metadata } from "next";
import { QRPageClient } from "./QRPageClient";

export const metadata: Metadata = {
  title: "Recipe QR Codes | AR Smart Cooking Assistant",
  description:
    "Scan a recipe QR code with your phone to open its step-by-step cooking instructions.",
};

export default function QRPage() {
  return <QRPageClient />;
}
