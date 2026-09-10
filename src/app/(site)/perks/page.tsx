import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perks | AR Smart Cooking Assistant",
  description: "Unlock exclusive rewards and perks with your cooking points.",
};

export default function PerksPage() {
  return (
    <section
      style={{
        minHeight: "calc(100vh - 64px - 200px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.25rem",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "20px",
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          marginBottom: "1.5rem",
        }}
      >
        🎁
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
          fontWeight: 800,
          color: "#f0fdf4",
          letterSpacing: "-0.025em",
          marginBottom: "0.75rem",
        }}
      >
        Perks
      </h1>

      <p
        style={{
          fontSize: "0.9375rem",
          color: "#a3b3a8",
          maxWidth: "420px",
          lineHeight: 1.7,
          marginBottom: "2.5rem",
        }}
      >
        Your cooking achievements will appear here.
      </p>

      <Link
        href="/leaderboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.625rem",
          border: "1px solid rgba(34,197,94,0.25)",
          backgroundColor: "rgba(34,197,94,0.07)",
          color: "#4ade80",
          fontWeight: 600,
          fontSize: "0.9375rem",
          textDecoration: "none",
        }}
      >
        View Leaderboard
      </Link>
    </section>
  );
}
