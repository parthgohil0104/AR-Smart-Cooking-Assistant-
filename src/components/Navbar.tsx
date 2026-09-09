"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Recipes", href: "/recipes" },
  { label: "Scan Recipe", href: "/scan" },
  { label: "QR Codes", href: "/qr" },
  { label: "AI Assistant", href: "/ai" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Perks", href: "/perks" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(10, 15, 13, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(34,197,94,0.12)",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.25rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
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
              letterSpacing: "-0.01em",
            }}
          >
            AR<span style={{ color: "#22c55e" }}>Cook</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <ul
          style={{
            display: "none",
            listStyle: "none",
            gap: "0.25rem",
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    display: "block",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#22c55e" : "#a3b3a8",
                    backgroundColor: active
                      ? "rgba(34,197,94,0.1)"
                      : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Scan CTA (desktop) */}
        <div style={{ display: "none" }} className="desktop-cta">
          <Link
            href="/scan"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.625rem",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            <span>📷</span> Scan
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
          }}
          className="mobile-menu-btn"
        >
          <span
            style={{
              display: "block",
              width: "22px",
              height: "2px",
              backgroundColor: "#f0fdf4",
              borderRadius: "2px",
              transition: "transform 0.2s",
              transformOrigin: "center",
              transform: mobileOpen ? "translateY(7px) rotate(45deg)" : "none",
            }}
          />
          <span
            style={{
              display: "block",
              width: "22px",
              height: "2px",
              backgroundColor: "#f0fdf4",
              borderRadius: "2px",
              opacity: mobileOpen ? 0 : 1,
              transition: "opacity 0.2s",
            }}
          />
          <span
            style={{
              display: "block",
              width: "22px",
              height: "2px",
              backgroundColor: "#f0fdf4",
              borderRadius: "2px",
              transition: "transform 0.2s",
              transformOrigin: "center",
              transform: mobileOpen ? "translateY(-7px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div
          style={{
            borderTop: "1px solid rgba(34,197,94,0.1)",
            backgroundColor: "rgba(10, 15, 13, 0.97)",
            padding: "0.75rem 1.25rem 1rem",
          }}
          className="mobile-menu"
        >
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: "block",
                      padding: "0.625rem 0.75rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.9375rem",
                      fontWeight: active ? 600 : 400,
                      color: active ? "#22c55e" : "#a3b3a8",
                      backgroundColor: active
                        ? "rgba(34,197,94,0.1)"
                        : "transparent",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/scan"
            onClick={() => setMobileOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "0.75rem",
              padding: "0.75rem",
              borderRadius: "0.625rem",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9375rem",
              textDecoration: "none",
            }}
          >
            📷 Scan Recipe
          </Link>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-cta { display: block !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </header>
  );
}
