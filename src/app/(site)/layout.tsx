import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/**
 * Site layout: wraps all normal website pages with the shared
 * Navbar and Footer.
 *
 * This layout applies to every route inside src/app/(site)/:
 *   /          (home)
 *   /ai
 *   /dashboard
 *   /leaderboard
 *   /perks
 *   /qr
 *   /recipe/[id]
 *   /recipes
 *   /scan
 *
 * The /ar/[id] route is intentionally outside this group
 * so it never renders the Navbar or Footer.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
