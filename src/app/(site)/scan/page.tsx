import type { Metadata } from "next";
import { QRScannerClient } from "./QRScannerClient";

export const metadata: Metadata = {
  title: "Scan Recipe | AR Smart Cooking Assistant",
  description: "Scan a recipe QR code to instantly load ingredients, steps, and AR cooking guidance.",
};

export default function ScanPage() {
  return <QRScannerClient />;
}
