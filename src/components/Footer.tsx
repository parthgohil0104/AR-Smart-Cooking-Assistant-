import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Recipes", href: "/recipes" },
  { label: "Scan Recipe", href: "/scan" },
  { label: "AI Assistant", href: "/ai" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Perks", href: "/perks" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(34,197,94,0.1)",
        backgroundColor: "var(--color-surface-800)",
        padding: "3rem 1.25rem 1.5rem",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "2.5rem",
        }}
      >
        {/* Brand */}
        <div>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              marginBottom: "0.75rem",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              🍳
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#f0fdf4",
              }}
            >
              AR<span style={{ color: "#22c55e" }}>Cook</span>
            </span>
          </Link>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7f74",
              lineHeight: 1.6,
              maxWidth: "280px",
            }}
          >
            Step-by-step cooking guidance using augmented reality and AI — right from your phone.
          </p>
        </div>

        {/* Navigation links */}
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6b7f74",
              marginBottom: "0.75rem",
            }}
          >
            Navigation
          </p>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.25rem 1.5rem",
            }}
          >
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    fontSize: "0.875rem",
                    color: "#a3b3a8",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(34,197,94,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: "#6b7f74" }}>
          © {year} AR Smart Cooking Assistant. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
