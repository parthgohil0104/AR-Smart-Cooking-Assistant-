"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

interface RecipeQRCardProps {
  id: string;
  name: string;
  difficulty: string;
  cookingTime: number;
  /** Full absolute URL that the QR code encodes */
  qrUrl: string;
}

const difficultyColors: Record<string, { bg: string; text: string }> = {
  Easy: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  Medium: { bg: "rgba(251,146,60,0.15)", text: "#fb923c" },
  Hard: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

export function RecipeQRCard({
  id,
  name,
  difficulty,
  cookingTime,
  qrUrl,
}: RecipeQRCardProps) {
  const colors = difficultyColors[difficulty] ?? difficultyColors["Medium"];

  // Extract just the path portion to show below the QR code
  const displayPath = new URL(qrUrl).pathname;

  return (
    <article
      style={{
        backgroundColor: "var(--color-surface-800)",
        border: "1px solid rgba(34,197,94,0.14)",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      className="qr-card"
    >
      {/* Recipe name */}
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "#f0fdf4",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {name}
      </h2>

      {/* Meta badges */}
      <div
        style={{
          display: "flex",
          gap: "0.625rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: colors.bg,
            color: colors.text,
          }}
        >
          {difficulty}
        </span>
        <span
          style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 500,
            backgroundColor: "rgba(255,255,255,0.06)",
            color: "#a3b3a8",
          }}
        >
          ⏱ {cookingTime} min
        </span>
      </div>

      {/* QR Code */}
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          lineHeight: 0,
          boxShadow: "0 0 0 4px rgba(34,197,94,0.18)",
        }}
        aria-label={`QR code for ${name}`}
      >
        <QRCodeSVG
          value={qrUrl}
          size={180}
          level="M"
          includeMargin={false}
          fgColor="#0a0f0d"
          bgColor="#ffffff"
        />
      </div>

      {/* Encoded path label */}
      <p
        style={{
          fontFamily: "monospace",
          fontSize: "0.75rem",
          color: "#6b7f74",
          textAlign: "center",
          wordBreak: "break-all",
          lineHeight: 1.5,
          maxWidth: "220px",
        }}
      >
        {displayPath}
      </p>

      {/* View Recipe button */}
      <Link
        href={`/recipe/${id}`}
        id={`view-recipe-${id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          padding: "0.625rem 1.375rem",
          borderRadius: "0.625rem",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.875rem",
          textDecoration: "none",
          width: "100%",
          transition: "opacity 0.15s ease",
        }}
        className="view-recipe-btn"
      >
        <span>📖</span> View Recipe
      </Link>
    </article>
  );
}
