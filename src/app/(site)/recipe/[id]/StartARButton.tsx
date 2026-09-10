"use client";

interface StartARButtonProps {
  recipeId: string;
}

export function StartARButton({ recipeId }: StartARButtonProps) {
  const handleClick = () => {
    window.open(`/ar/${recipeId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
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
  );
}
