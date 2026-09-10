import Link from "next/link";
import { getRecipeById, recipes } from "@/data/recipes";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) return { title: "Recipe Not Found" };
  return {
    title: `${recipe.name} | AR Smart Cooking Assistant`,
    description: recipe.description,
  };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const recipe = getRecipeById(id);

  if (!recipe) notFound();

  const difficultyColor =
    recipe.difficulty === "Easy"
      ? "#4ade80"
      : recipe.difficulty === "Medium"
      ? "#fb923c"
      : "#f87171";

  const difficultyBg =
    recipe.difficulty === "Easy"
      ? "rgba(34,197,94,0.15)"
      : recipe.difficulty === "Medium"
      ? "rgba(251,146,60,0.15)"
      : "rgba(239,68,68,0.15)";

  return (
    <>
      <article
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "3rem 1.25rem 5rem",
        }}
      >
        {/* Back link */}
        <Link
          href="/qr"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.875rem",
            color: "#a3b3a8",
            textDecoration: "none",
            marginBottom: "2rem",
          }}
        >
          ← Back to QR Codes
        </Link>

        {/* Hero */}
        <header style={{ marginBottom: "2.5rem" }}>
          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: "0.625rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                padding: "0.3rem 0.875rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: difficultyBg,
                color: difficultyColor,
              }}
            >
              {recipe.difficulty}
            </span>
            <span
              style={{
                padding: "0.3rem 0.875rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 500,
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#a3b3a8",
              }}
            >
              ⏱ {recipe.cookingTime} min
            </span>
            <span
              style={{
                padding: "0.3rem 0.875rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 500,
                backgroundColor: "rgba(251,191,36,0.1)",
                color: "#fbbf24",
              }}
            >
              ⭐ {recipe.points} pts
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f0fdf4",
              lineHeight: 1.15,
              marginBottom: "0.875rem",
            }}
          >
            {recipe.name}
          </h1>

          <p
            style={{
              fontSize: "1rem",
              color: "#a3b3a8",
              lineHeight: 1.7,
              maxWidth: "640px",
            }}
          >
            {recipe.description}
          </p>
        </header>

        {/* Two-column layout: Ingredients | Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "2rem",
          }}
          className="recipe-layout"
        >
          {/* Ingredients */}
          <section
            style={{
              backgroundColor: "var(--color-surface-800)",
              border: "1px solid rgba(34,197,94,0.12)",
              borderRadius: "1rem",
              padding: "1.75rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "#f0fdf4",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              🧂 Ingredients
            </h2>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {recipe.ingredients.map((ing, idx) => (
                <li
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    paddingBottom: "0.625rem",
                    borderBottom:
                      idx < recipe.ingredients.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                >
                  <span style={{ fontSize: "0.9rem", color: "#d1fae5" }}>
                    {ing.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "#6b7f74",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ing.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "#f0fdf4",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              👨‍🍳 Cooking Steps
            </h2>
            <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {recipe.steps.map((step) => (
                <li
                  key={step.stepNumber}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    backgroundColor: "var(--color-surface-800)",
                    border: "1px solid rgba(34,197,94,0.1)",
                    borderRadius: "0.875rem",
                    padding: "1.25rem",
                  }}
                >
                  {/* Step number */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      color: "#fff",
                    }}
                  >
                    {step.stepNumber}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "0.9375rem",
                        color: "#d1fae5",
                        lineHeight: 1.65,
                        marginBottom: step.optionalTip ? "0.625rem" : 0,
                      }}
                    >
                      {step.instruction}
                    </p>
                    {step.optionalTip && (
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "#fb923c",
                          backgroundColor: "rgba(251,146,60,0.08)",
                          borderLeft: "3px solid rgba(251,146,60,0.5)",
                          paddingLeft: "0.75rem",
                          paddingTop: "0.375rem",
                          paddingBottom: "0.375rem",
                          borderRadius: "0 4px 4px 0",
                          lineHeight: 1.55,
                        }}
                      >
                        💡 {step.optionalTip}
                      </p>
                    )}
                    {step.duration > 0 && (
                      <p
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.75rem",
                          color: "#6b7f74",
                        }}
                      >
                        ⏱{" "}
                        {step.duration >= 60
                          ? `${Math.floor(step.duration / 60)} min ${step.duration % 60 > 0 ? `${step.duration % 60} sec` : ""}`.trim()
                          : `${step.duration} sec`}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* AR Cooking CTA */}
        <div
          style={{
            marginTop: "2.5rem",
            padding: "1.75rem",
            background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(251,146,60,0.08))",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: "1.25rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>📱</div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.125rem", color: "#f0fdf4", marginBottom: "0.375rem" }}>
              Ready to Cook?
            </p>
            <p style={{ fontSize: "0.875rem", color: "#a3b3a8", lineHeight: 1.6 }}>
              Enter AR Cooking Mode and follow step-by-step instructions overlaid on your real kitchen.
            </p>
          </div>
          <Link
            href={`/ar/${recipe.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.875rem 2rem",
              borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(34,197,94,0.35)",
            }}
            id="start-ar-btn"
          >
            🥽 Start AR Cooking
          </Link>
        </div>

        {/* Footer links */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/qr"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.625rem",
              border: "1px solid rgba(34,197,94,0.3)",
              backgroundColor: "rgba(34,197,94,0.06)",
              color: "#f0fdf4",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            ← All QR Codes
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.625rem",
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "transparent",
              color: "#a3b3a8",
              fontWeight: 500,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            🏠 Home
          </Link>
        </div>
      </article>

      <style>{`
        @media (min-width: 700px) {
          .recipe-layout {
            grid-template-columns: 320px 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
