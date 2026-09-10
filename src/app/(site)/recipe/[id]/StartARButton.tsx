"use client";

import { useState } from "react";

interface StartARButtonProps {
  recipeId: string;
  recipeName: string;
}

export function StartARButton({ recipeId, recipeName }: StartARButtonProps) {
  const [showPrep, setShowPrep] = useState(false);

  /* Open preparation overlay */
  const handleStartARCooking = () => {
    setShowPrep(true);
  };

  /* Open AR tab — called directly from user click so window.open is allowed */
  const handleOpenARTab = () => {
    window.open(`/ar/${recipeId}`, "_blank", "noopener,noreferrer");
    setShowPrep(false);
  };

  const handleCancel = () => {
    setShowPrep(false);
  };

  return (
    <>
      {/* ── "Start AR Cooking" button on the recipe page ── */}
      <button
        onClick={handleStartARCooking}
        id="start-ar-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 2rem",
          borderRadius: "0.75rem",
          border: "none",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
          fontFamily: "inherit",
        }}
      >
        🥽 Start AR Cooking
      </button>

      {/* ── Hiro marker preparation overlay ── */}
      {showPrep && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AR Cooking Setup"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(5, 10, 8, 0.96)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem 1.25rem",
            textAlign: "center",
            overflowY: "auto",
          }}
        >
          {/* Close (×) */}
          <button
            onClick={handleCancel}
            aria-label="Close AR setup"
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "none",
              border: "none",
              color: "#a3b3a8",
              fontSize: "1.5rem",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0.25rem",
            }}
          >
            ✕
          </button>

          {/* Heading */}
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#22c55e",
              marginBottom: "0.625rem",
            }}
          >
            AR Cooking Setup
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.25rem, 4vw, 1.875rem)",
              fontWeight: 800,
              color: "#f0fdf4",
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            {recipeName}
          </h2>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#a3b3a8",
              maxWidth: "400px",
              lineHeight: 1.65,
              marginBottom: "1.75rem",
            }}
          >
            Place or display this{" "}
            <strong style={{ color: "#f0fdf4" }}>Hiro marker</strong> in your
            cooking workspace. Point the camera at it once the AR tab opens.
          </p>

          {/* Hiro marker image */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "1rem",
              padding: "1rem",
              marginBottom: "1rem",
              display: "inline-block",
              boxShadow: "0 0 40px rgba(34,197,94,0.2)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ar/hiro-marker.png"
              alt="Hiro AR marker — print or display on another screen"
              style={{
                width: "clamp(160px, 40vw, 220px)",
                height: "clamp(160px, 40vw, 220px)",
                display: "block",
              }}
            />
          </div>

          <p
            style={{
              fontSize: "0.8125rem",
              color: "#6b7f74",
              marginBottom: "2rem",
            }}
          >
            <a
              href="/ar/hiro-marker.png"
              download
              style={{ color: "#4ade80", textDecoration: "underline" }}
            >
              Download marker
            </a>{" "}
            — print it or open on a second screen
          </p>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              width: "100%",
              maxWidth: "320px",
            }}
          >
            <button
              onClick={handleOpenARTab}
              id="open-ar-tab-btn"
              style={{
                padding: "0.9375rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              📸 Start AR
            </button>

            <button
              onClick={handleCancel}
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#6b7f74",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
