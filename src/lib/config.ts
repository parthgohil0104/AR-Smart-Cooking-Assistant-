/**
 * AR Smart Cooking Assistant — Canonical Application URL
 *
 * This is the single source of truth for the production URL.
 * All QR codes must encode URLs based on this constant.
 *
 * Do NOT derive the URL from window.location, window.location.origin,
 * or any runtime browser value — those resolve to Vercel preview URLs
 * on CI deployments and localhost in development.
 */
export const CANONICAL_APP_URL = "https://ar-smart-cooking-assistant.vercel.app";
