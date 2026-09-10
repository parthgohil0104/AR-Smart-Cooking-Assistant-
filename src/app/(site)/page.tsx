import Link from "next/link";

const features = [
  {
    icon: "📱",
    title: "QR Recipe Access",
    description:
      "Instantly load any recipe by scanning its QR code with your phone camera. No typing, no searching.",
  },
  {
    icon: "🥽",
    title: "AR Cooking Guidance",
    description:
      "See real-time augmented reality overlays on your ingredients and cookware as you cook each step.",
  },
  {
    icon: "🤖",
    title: "AI Cooking Assistant",
    description:
      "Ask questions, get substitutions, and receive personalized tips from an AI trained on culinary expertise.",
  },
  {
    icon: "🏆",
    title: "Gamified Cooking",
    description:
      "Earn points, unlock perks, and climb the leaderboard as you complete recipes and master techniques.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 1.25rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle background glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.12) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.25rem, 7vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#f0fdf4",
            maxWidth: "800px",
            marginBottom: "0.75rem",
          }}
        >
          AR Smart{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #22c55e, #4ade80)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Cooking
          </span>{" "}
          Assistant
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: "clamp(1.125rem, 3vw, 1.375rem)",
            fontWeight: 500,
            color: "#4ade80",
            marginBottom: "1rem",
            letterSpacing: "0.02em",
          }}
        >
          Scan. Cook. Learn. Compete.
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: "clamp(0.9375rem, 2.5vw, 1.125rem)",
            color: "#a3b3a8",
            maxWidth: "560px",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
          }}
        >
          Scan a recipe QR code and receive step-by-step cooking guidance using
          augmented reality and AI.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <Link
            href="/scan"
            id="hero-scan-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1.75rem",
              borderRadius: "0.625rem",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 0 24px rgba(34,197,94,0.25)",
            }}
          >
            <span>📷</span> Scan Recipe
          </Link>
          <Link
            href="/recipes"
            id="hero-explore-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 1.75rem",
              borderRadius: "0.625rem",
              border: "1px solid rgba(34,197,94,0.3)",
              backgroundColor: "rgba(34,197,94,0.06)",
              color: "#f0fdf4",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            Explore Recipes
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          padding: "5rem 1.25rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#22c55e",
              marginBottom: "0.5rem",
            }}
          >
            Core Features
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 700,
              color: "#f0fdf4",
              letterSpacing: "-0.02em",
            }}
          >
            Everything you need to cook smarter
          </h2>
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              style={{
                padding: "1.75rem",
                borderRadius: "1rem",
                border: "1px solid rgba(34,197,94,0.12)",
                backgroundColor: "var(--color-surface-800)",
                display: "flex",
                flexDirection: "column",
                gap: "0.875rem",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(34,197,94,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1.0625rem",
                  color: "#f0fdf4",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#a3b3a8",
                  lineHeight: 1.65,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
