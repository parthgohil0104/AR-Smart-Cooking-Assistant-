"use client";

import { recipes } from "@/data/recipes";
import { RecipeQRCard } from "@/components/RecipeQRCard";
import { CANONICAL_APP_URL } from "@/lib/config";

/**
 * QR page client component.
 *
 * QR codes ALWAYS encode the canonical production URL regardless of
 * which environment (localhost, Vercel preview, production) is rendering
 * the page. This prevents preview-deployment URLs from being baked into
 * printed QR codes.
 */
export function QRPageClient() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <section
        style={{
          minHeight: "calc(100vh - 64px)",
          padding: "4rem 1.25rem 5rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Page header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "3rem",
            position: "relative",
          }}
        >
          {/* Background glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-60px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "480px",
              height: "200px",
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(34,197,94,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.875rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f0fdf4",
              lineHeight: 1.1,
              marginBottom: "0.875rem",
            }}
          >
            Recipe{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #22c55e, #4ade80)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              QR Codes
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)",
              color: "#a3b3a8",
              maxWidth: "520px",
              margin: "0 auto 1.75rem",
              lineHeight: 1.7,
            }}
          >
            Scan a recipe QR code with your phone to open its cooking
            instructions.
          </p>

          {/* Print button */}
          <button
            id="print-qr-codes-btn"
            onClick={handlePrint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.375rem",
              borderRadius: "0.625rem",
              border: "1px solid rgba(34,197,94,0.35)",
              backgroundColor: "rgba(34,197,94,0.08)",
              color: "#4ade80",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            className="print-btn"
          >
            <span>🖨️</span> Print QR Codes
          </button>
        </div>

        {/* QR card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {recipes.map((recipe) => (
            <RecipeQRCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.name}
              difficulty={recipe.difficulty}
              cookingTime={recipe.cookingTime}
              qrUrl={`${CANONICAL_APP_URL}/recipe/${recipe.id}`}
            />
          ))}
        </div>
      </section>

      <style>{`
        .qr-card:hover {
          border-color: rgba(34, 197, 94, 0.38) !important;
          box-shadow: 0 4px 24px rgba(34, 197, 94, 0.1);
        }
        .view-recipe-btn:hover {
          opacity: 0.88;
        }
        .print-btn:hover {
          background-color: rgba(34, 197, 94, 0.15) !important;
        }

        /* ── Print styles ─────────────────────────────────────────────────── */
        @media print {
          header, footer, .print-btn { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          section { padding: 0 !important; max-width: 100% !important; }
          .qr-card {
            border: 1px solid #ccc !important;
            background: #fff !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          h1, h2, p { color: #111 !important; }
        }
      `}</style>
    </>
  );
}
