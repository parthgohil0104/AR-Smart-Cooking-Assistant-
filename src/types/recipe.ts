/**
 * AR Smart Cooking Assistant — Recipe Type Definitions
 * These types are used throughout the app and are designed to
 * support QR-code integration, AR step guidance, and gamification
 * in future phases.
 */

// ─── Difficulty ───────────────────────────────────────────────────────────────

export type Difficulty = "Easy" | "Medium" | "Hard";

// ─── Ingredient ───────────────────────────────────────────────────────────────

export interface Ingredient {
  /** Display name of the ingredient */
  name: string;
  /** Human-readable quantity, e.g. "2 cups", "1 tsp", "as needed" */
  quantity: string;
}

// ─── Cooking Step ─────────────────────────────────────────────────────────────

export interface CookingStep {
  /** 1-based step index */
  stepNumber: number;
  /** The main instruction text shown to the user */
  instruction: string;
  /**
   * Approximate duration for this step in seconds.
   * Used for AR timer overlays in future phases.
   */
  duration: number;
  /** Optional tip shown alongside the step (null if none) */
  optionalTip: string | null;
}

// ─── Recipe ───────────────────────────────────────────────────────────────────

export interface Recipe {
  /**
   * Unique recipe identifier.
   * Format: "recipe-<slug>" — used as the QR code payload in Phase 3.
   */
  id: string;
  /** Full display name of the recipe */
  name: string;
  /** Short description shown on cards and recipe detail pages */
  description: string;
  /**
   * Path to the recipe hero image.
   * Relative to /public, e.g. "/images/recipes/masala-maggi.jpg"
   */
  image: string;
  difficulty: Difficulty;
  /** Total active cooking time in minutes */
  cookingTime: number;
  /** Gamification points awarded on recipe completion */
  points: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
}

// ─── Helper / Utility Types ───────────────────────────────────────────────────

/** Lightweight summary used for recipe cards and lists */
export type RecipeSummary = Pick<
  Recipe,
  "id" | "name" | "description" | "image" | "difficulty" | "cookingTime" | "points"
>;
