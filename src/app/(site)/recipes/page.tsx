import Link from "next/link";
import Image from "next/image";
import { recipes } from "@/data/recipes";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Recipes | AR Smart Cooking Assistant",
  description: "Browse and discover step-by-step AR-guided recipes.",
};

const difficultyColors: Record<string, { bg: string; text: string }> = {
  Easy: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  Medium: { bg: "rgba(251,146,60,0.15)", text: "#fb923c" },
  Hard: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
};

export default function RecipesPage() {
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
              Library
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)",
              color: "#a3b3a8",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Browse our curated collection of interactive recipes. Click on a recipe to view its details.
          </p>
        </div>

        {/* Recipe card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {recipes.map((recipe) => {
            const colors = difficultyColors[recipe.difficulty] ?? difficultyColors["Medium"];

            return (
              <article
                key={recipe.id}
                style={{
                  backgroundColor: "var(--color-surface-800)",
                  border: "1px solid rgba(34,197,94,0.14)",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                className="recipe-card"
              >
                {/* Recipe Image */}
                <div
                  style={{
                    height: "180px",
                    width: "100%",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    position: "relative",
                    borderBottom: "1px solid rgba(34,197,94,0.14)",
                  }}
                >
                  <Image
                    src={recipe.image}
                    alt={recipe.name}
                    width={400}
                    height={300}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    gap: "1rem",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#f0fdf4",
                      lineHeight: 1.3,
                    }}
                  >
                    {recipe.name}
                  </h2>

                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#a3b3a8",
                      lineHeight: 1.6,
                      flex: 1,
                    }}
                  >
                    {recipe.description}
                  </p>

                  {/* Meta badges */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      {recipe.difficulty}
                    </span>
                    <span
                      style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "#a3b3a8",
                      }}
                    >
                      ⏱ {recipe.cookingTime} min
                    </span>
                    <span
                      style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        backgroundColor: "rgba(251,191,36,0.1)",
                        color: "#fbbf24",
                      }}
                    >
                      ⭐ {recipe.points} pts
                    </span>
                  </div>

                  {/* View Recipe button */}
                  <Link
                    href={`/recipe/${recipe.id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      padding: "0.625rem",
                      marginTop: "0.5rem",
                      borderRadius: "0.625rem",
                      border: "1px solid rgba(34,197,94,0.3)",
                      backgroundColor: "rgba(34,197,94,0.06)",
                      color: "#4ade80",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textDecoration: "none",
                      width: "100%",
                      transition: "background-color 0.15s ease",
                    }}
                    className="view-recipe-btn"
                  >
                    <span>📖</span> View Recipe
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <style>{`
        .recipe-card:hover {
          border-color: rgba(34, 197, 94, 0.38) !important;
          box-shadow: 0 4px 24px rgba(34, 197, 94, 0.1);
        }
        .view-recipe-btn:hover {
          background-color: rgba(34, 197, 94, 0.15) !important;
        }
      `}</style>
    </>
  );
}
