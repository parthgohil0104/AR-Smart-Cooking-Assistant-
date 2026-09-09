import Link from "next/link";

interface PlaceholderPageProps {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  comingSoonFeatures: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function PlaceholderPage({
  icon,
  title,
  subtitle,
  description,
  comingSoonFeatures,
  ctaLabel,
  ctaHref,
}: PlaceholderPageProps) {
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
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
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
        {icon}
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
          fontWeight: 800,
          color: "#f0fdf4",
          letterSpacing: "-0.025em",
          marginBottom: "0.5rem",
        }}
      >
        {title}
      </h1>

      <p
        style={{
          fontSize: "1rem",
          fontWeight: 500,
          color: "#22c55e",
          marginBottom: "1rem",
        }}
      >
        {subtitle}
      </p>

      <p
        style={{
          fontSize: "0.9375rem",
          color: "#a3b3a8",
          maxWidth: "480px",
          lineHeight: 1.7,
          marginBottom: "2.5rem",
        }}
      >
        {description}
      </p>

      {/* Coming-soon features list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
          width: "100%",
          maxWidth: "400px",
          marginBottom: "2.5rem",
          textAlign: "left",
        }}
      >
        {comingSoonFeatures.map((feat) => (
          <div
            key={feat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.625rem",
              border: "1px solid rgba(34,197,94,0.1)",
              backgroundColor: "var(--color-surface-800)",
              fontSize: "0.875rem",
              color: "#a3b3a8",
            }}
          >
            <span style={{ color: "#22c55e", fontSize: "1rem" }}>◦</span>
            {feat}
          </div>
        ))}
      </div>

      {/* Optional CTA */}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
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
          {ctaLabel}
        </Link>
      )}
    </section>
  );
}
