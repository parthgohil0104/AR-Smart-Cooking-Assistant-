"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Recipe, CookingStep } from "@/types/recipe";

/* ─── Types ───────────────────────────────────────────────────────────────── */

type ARPhase = "intro" | "ar" | "complete";

interface TimerState {
  remaining: number;
  running: boolean;
  total: number;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ARCookingClient({ recipe }: { recipe: Recipe }) {
  /* ── State ────────────────────────────────────────────────────────────── */
  const [phase, setPhase] = useState<ARPhase>("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState<TimerState>({ remaining: 0, running: false, total: 0 });
  const [markerDetected, setMarkerDetected] = useState(false);
  const [arError, setArError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const scriptsLoadedRef = useRef(false);

  const step: CookingStep = recipe.steps[currentStep];
  const totalSteps = recipe.steps.length;

  /* ── Timer logic ──────────────────────────────────────────────────────── */
  const resetTimer = useCallback((duration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer({ remaining: duration, running: false, total: duration });
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer((prev) => ({ ...prev, running: true }));
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev.remaining <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, remaining: 0, running: false };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer((prev) => ({ ...prev, running: false }));
  }, []);

  // Reset timer when step changes
  useEffect(() => {
    if (step) resetTimer(step.duration);
  }, [currentStep, step, resetTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ── Navigation ───────────────────────────────────────────────────────── */
  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("complete");
    }
  }, [currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  }, [currentStep]);

  /* ── Load A-Frame + AR.js scripts ─────────────────────────────────────── */
  const loadARScripts = useCallback((): Promise<void> => {
    if (scriptsLoadedRef.current) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Load A-Frame first
      const aframe = document.createElement("script");
      aframe.src = "https://aframe.io/releases/1.6.0/aframe.min.js";
      aframe.onload = () => {
        // Then load AR.js
        const arjs = document.createElement("script");
        arjs.src = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js";
        arjs.onload = () => {
          scriptsLoadedRef.current = true;
          resolve();
        };
        arjs.onerror = () => reject(new Error("Failed to load AR.js"));
        document.head.appendChild(arjs);
      };
      aframe.onerror = () => reject(new Error("Failed to load A-Frame"));
      document.head.appendChild(aframe);
    });
  }, []);

  /* ── Start AR session ─────────────────────────────────────────────────── */
  const startAR = useCallback(async () => {
    try {
      setArError(null);
      await loadARScripts();
      setPhase("ar");
    } catch (err) {
      setArError(err instanceof Error ? err.message : "Failed to initialize AR");
    }
  }, [loadARScripts]);

  /* ── Build AR scene once in "ar" phase ────────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar" || !arContainerRef.current) return;

    const container = arContainerRef.current;

    // Check if scene already exists
    if (container.querySelector("a-scene")) return;

    // We need to give A-Frame a moment to register
    const buildTimeout = setTimeout(() => {
      try {
        // Create A-Frame scene
        const scene = document.createElement("a-scene");
        scene.setAttribute("embedded", "");
        scene.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;");
        scene.setAttribute("renderer", "logarithmicDepthBuffer: true; precision: medium;");
        scene.setAttribute("vr-mode-ui", "enabled: false");
        scene.style.position = "fixed";
        scene.style.top = "0";
        scene.style.left = "0";
        scene.style.width = "100%";
        scene.style.height = "100%";
        scene.style.zIndex = "0";

        // Marker (using built-in "hiro" marker — most reliable for AR.js)
        const marker = document.createElement("a-marker");
        marker.setAttribute("preset", "hiro");
        marker.setAttribute("id", "ar-cooking-marker");

        // Event listeners for marker detection
        marker.addEventListener("markerFound", () => setMarkerDetected(true));
        marker.addEventListener("markerLost", () => setMarkerDetected(false));

        // ── AR Panel Background ──
        const panelBg = document.createElement("a-plane");
        panelBg.setAttribute("position", "0 0.8 0");
        panelBg.setAttribute("rotation", "-90 0 0");
        panelBg.setAttribute("width", "2.4");
        panelBg.setAttribute("height", "1.8");
        panelBg.setAttribute("color", "#111812");
        panelBg.setAttribute("opacity", "0.92");
        panelBg.setAttribute("side", "double");
        marker.appendChild(panelBg);

        // ── Green accent bar at top ──
        const accentBar = document.createElement("a-plane");
        accentBar.setAttribute("position", "0 0.81 0.75");
        accentBar.setAttribute("rotation", "-90 0 0");
        accentBar.setAttribute("width", "2.4");
        accentBar.setAttribute("height", "0.08");
        accentBar.setAttribute("color", "#22c55e");
        accentBar.setAttribute("opacity", "0.9");
        marker.appendChild(accentBar);

        // ── Title: AR COOKING ──
        const titleText = document.createElement("a-text");
        titleText.setAttribute("value", "AR COOKING");
        titleText.setAttribute("position", "0 0.82 0.55");
        titleText.setAttribute("rotation", "-90 0 0");
        titleText.setAttribute("align", "center");
        titleText.setAttribute("color", "#22c55e");
        titleText.setAttribute("width", "2.0");
        titleText.setAttribute("font", "mozillavr");
        marker.appendChild(titleText);

        // ── Recipe name ──
        const nameText = document.createElement("a-text");
        nameText.setAttribute("value", recipe.name.toUpperCase());
        nameText.setAttribute("position", "0 0.83 0.35");
        nameText.setAttribute("rotation", "-90 0 0");
        nameText.setAttribute("align", "center");
        nameText.setAttribute("color", "#f0fdf4");
        nameText.setAttribute("width", "1.8");
        nameText.setAttribute("font", "mozillavr");
        nameText.setAttribute("id", "ar-recipe-name");
        marker.appendChild(nameText);

        // ── Step counter ──
        const stepText = document.createElement("a-text");
        stepText.setAttribute("value", `STEP 1 OF ${totalSteps}`);
        stepText.setAttribute("position", "0 0.84 0.1");
        stepText.setAttribute("rotation", "-90 0 0");
        stepText.setAttribute("align", "center");
        stepText.setAttribute("color", "#4ade80");
        stepText.setAttribute("width", "1.5");
        stepText.setAttribute("font", "mozillavr");
        stepText.setAttribute("id", "ar-step-counter");
        marker.appendChild(stepText);

        // ── Instruction text ──
        const instrText = document.createElement("a-text");
        instrText.setAttribute("value", wrapText(recipe.steps[0].instruction, 35));
        instrText.setAttribute("position", "0 0.85 -0.2");
        instrText.setAttribute("rotation", "-90 0 0");
        instrText.setAttribute("align", "center");
        instrText.setAttribute("color", "#d1fae5");
        instrText.setAttribute("width", "1.6");
        instrText.setAttribute("font", "mozillavr");
        instrText.setAttribute("id", "ar-instruction");
        instrText.setAttribute("baseline", "top");
        marker.appendChild(instrText);

        // ── Timer text ──
        const timerText = document.createElement("a-text");
        timerText.setAttribute("value", formatTime(recipe.steps[0].duration));
        timerText.setAttribute("position", "0 0.86 -0.55");
        timerText.setAttribute("rotation", "-90 0 0");
        timerText.setAttribute("align", "center");
        timerText.setAttribute("color", "#fb923c");
        timerText.setAttribute("width", "2.0");
        timerText.setAttribute("font", "mozillavr");
        timerText.setAttribute("id", "ar-timer");
        marker.appendChild(timerText);

        // ── Orange accent bar at bottom ──
        const bottomBar = document.createElement("a-plane");
        bottomBar.setAttribute("position", "0 0.81 -0.75");
        bottomBar.setAttribute("rotation", "-90 0 0");
        bottomBar.setAttribute("width", "2.4");
        bottomBar.setAttribute("height", "0.06");
        bottomBar.setAttribute("color", "#f97316");
        bottomBar.setAttribute("opacity", "0.7");
        marker.appendChild(bottomBar);

        // ── 3D cooking pot icon (simple cylinder + sphere) ──
        const pot = document.createElement("a-cylinder");
        pot.setAttribute("position", "0 0.5 0");
        pot.setAttribute("radius", "0.2");
        pot.setAttribute("height", "0.15");
        pot.setAttribute("color", "#3d5046");
        pot.setAttribute("metalness", "0.3");
        marker.appendChild(pot);

        const steam1 = document.createElement("a-sphere");
        steam1.setAttribute("position", "-0.05 0.7 0");
        steam1.setAttribute("radius", "0.04");
        steam1.setAttribute("color", "#a3b3a8");
        steam1.setAttribute("opacity", "0.4");
        steam1.setAttribute("animation", "property: position; to: -0.05 0.9 0; dur: 2000; easing: easeOutQuad; loop: true");
        marker.appendChild(steam1);

        const steam2 = document.createElement("a-sphere");
        steam2.setAttribute("position", "0.05 0.65 0");
        steam2.setAttribute("radius", "0.03");
        steam2.setAttribute("color", "#a3b3a8");
        steam2.setAttribute("opacity", "0.3");
        steam2.setAttribute("animation", "property: position; to: 0.05 0.85 0; dur: 2500; easing: easeOutQuad; loop: true; delay: 500");
        marker.appendChild(steam2);

        scene.appendChild(marker);

        // Camera entity
        const camera = document.createElement("a-entity");
        camera.setAttribute("camera", "");
        scene.appendChild(camera);

        container.appendChild(scene);
      } catch (err) {
        setArError(err instanceof Error ? err.message : "Failed to create AR scene");
      }
    }, 500);

    return () => clearTimeout(buildTimeout);
  }, [phase, recipe, totalSteps]);

  /* ── Update AR text when step changes ─────────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar") return;

    const updateTimeout = setTimeout(() => {
      const stepEl = document.getElementById("ar-step-counter");
      const instrEl = document.getElementById("ar-instruction");
      const timerEl = document.getElementById("ar-timer");

      if (stepEl) stepEl.setAttribute("value", `STEP ${currentStep + 1} OF ${totalSteps}`);
      if (instrEl) instrEl.setAttribute("value", wrapText(step.instruction, 35));
      if (timerEl) timerEl.setAttribute("value", formatTime(step.duration));
    }, 100);

    return () => clearTimeout(updateTimeout);
  }, [phase, currentStep, step, totalSteps]);

  /* ── Update AR timer display ──────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar") return;
    const timerEl = document.getElementById("ar-timer");
    if (timerEl) {
      timerEl.setAttribute("value", formatTime(timer.remaining));
      timerEl.setAttribute("color", timer.remaining === 0 && timer.total > 0 ? "#4ade80" : "#fb923c");
    }
  }, [phase, timer.remaining, timer.total]);

  /* ── Cleanup AR scene on unmount or phase change ──────────────────────── */
  useEffect(() => {
    return () => {
      // Remove A-Frame scene to stop camera
      const scenes = document.querySelectorAll("a-scene");
      scenes.forEach((s) => s.remove());
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*   RENDER — INTRO SCREEN                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (phase === "intro") {
    return (
      <>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.25rem",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Background glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ fontSize: "4rem", marginBottom: "1.5rem", animation: "arFloat 3s ease-in-out infinite" }}>
            🥽
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
              fontWeight: 800,
              color: "#f0fdf4",
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
            }}
          >
            AR Cooking Mode
          </h1>

          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1rem, 3vw, 1.375rem)",
              fontWeight: 600,
              color: "#4ade80",
              marginBottom: "1.5rem",
            }}
          >
            {recipe.name}
          </p>

          <p style={{ fontSize: "0.9375rem", color: "#a3b3a8", maxWidth: "400px", lineHeight: 1.7, marginBottom: "0.5rem" }}>
            Point your phone camera at the <strong style={{ color: "#4ade80" }}>Hiro AR marker</strong> to start the cooking guide.
          </p>
          <p style={{ fontSize: "0.8125rem", color: "#6b7f74", maxWidth: "400px", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Print the marker or display it on another screen. The cooking instructions will appear as an AR overlay anchored to the marker.
          </p>

          {/* Marker preview */}
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.75rem",
              background: "#fff",
              borderRadius: "1rem",
              display: "inline-block",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ar/hiro-marker.png"
              alt="Hiro AR Marker — print this or display on another screen"
              style={{ width: "160px", height: "160px", display: "block" }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#6b7f74", marginBottom: "2rem" }}>
            <a href="/ar/hiro-marker.png" download style={{ color: "#4ade80", textDecoration: "underline" }}>
              Download marker image
            </a>{" "}
            — print it or open on another device
          </p>

          {/* Recipe meta */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
            <span
              style={{
                padding: "0.3rem 0.875rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 600,
                backgroundColor: recipe.difficulty === "Easy" ? "rgba(34,197,94,0.15)" : recipe.difficulty === "Medium" ? "rgba(251,146,60,0.15)" : "rgba(239,68,68,0.15)",
                color: recipe.difficulty === "Easy" ? "#4ade80" : recipe.difficulty === "Medium" ? "#fb923c" : "#f87171",
              }}
            >
              {recipe.difficulty}
            </span>
            <span style={{ padding: "0.3rem 0.875rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 500, backgroundColor: "rgba(255,255,255,0.06)", color: "#a3b3a8" }}>
              {totalSteps} steps · {recipe.cookingTime} min
            </span>
            <span style={{ padding: "0.3rem 0.875rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 500, backgroundColor: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>
              ⭐ {recipe.points} pts
            </span>
          </div>

          {arError && (
            <p style={{ fontSize: "0.8125rem", color: "#f87171", marginBottom: "1rem", maxWidth: "400px" }}>
              ⚠️ {arError}
            </p>
          )}

          <button
            onClick={startAR}
            id="start-ar-session"
            style={{
              padding: "1rem 2.5rem",
              borderRadius: "0.875rem",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.0625rem",
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(34,197,94,0.4)",
              marginBottom: "1.5rem",
            }}
          >
            📸 Start AR
          </button>

          <Link href={`/recipe/${recipe.id}`} style={{ fontSize: "0.875rem", color: "#6b7f74", textDecoration: "none" }}>
            ← Back to Recipe
          </Link>
        </div>

        <style>{`
          @keyframes arFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}</style>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*   RENDER — COMPLETION SCREEN                                           */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (phase === "complete") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(251,191,36,0.05) 50%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🎉</div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            fontWeight: 800,
            color: "#f0fdf4",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem",
          }}
        >
          Recipe Complete!
        </h1>

        <p style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600, color: "#4ade80", marginBottom: "2rem" }}>
          {recipe.name}
        </p>

        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { value: totalSteps.toString(), label: "Steps Completed", color: "#4ade80", border: "rgba(34,197,94,0.2)" },
            { value: `+${recipe.points}`, label: "Points Earned", color: "#fbbf24", border: "rgba(251,191,36,0.2)" },
            { value: `${recipe.cookingTime}m`, label: "Cook Time", color: "#fb923c", border: "rgba(251,146,60,0.2)" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(17,24,18,0.8)",
                border: `1px solid ${stat.border}`,
                borderRadius: "1rem",
                padding: "1.25rem 1.5rem",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7f74", marginTop: "0.25rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href={`/recipe/${recipe.id}`}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(34,197,94,0.3)",
              backgroundColor: "rgba(34,197,94,0.06)",
              color: "#4ade80",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            📖 View Recipe
          </Link>
          <Link
            href="/recipes"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            🍽️ More Recipes
          </Link>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*   RENDER — AR MODE (A-Frame + AR.js scene with HUD overlay)            */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <>
      {/* A-Frame AR scene container */}
      <div ref={arContainerRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />

      {/* HUD Overlay — always on top of the AR camera */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            background: "rgba(10,15,13,0.8)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid rgba(34,197,94,0.2)",
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <button
              onClick={() => {
                // Remove A-Frame scene to stop camera
                const scenes = document.querySelectorAll("a-scene");
                scenes.forEach((s) => s.remove());
                setPhase("intro");
                setMarkerDetected(false);
              }}
              style={{ background: "none", border: "none", color: "#a3b3a8", cursor: "pointer", fontSize: "1.125rem", padding: "0.25rem" }}
              aria-label="Exit AR mode"
            >
              ✕
            </button>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "#f0fdf4" }}>
              {recipe.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: markerDetected ? "#22c55e" : "#f87171",
                display: "inline-block",
                boxShadow: markerDetected ? "0 0 8px rgba(34,197,94,0.6)" : "none",
              }}
            />
            <span
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                backgroundColor: markerDetected ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                color: markerDetected ? "#4ade80" : "#f87171",
              }}
            >
              {markerDetected ? "AR Active" : "Scan Marker"}
            </span>
          </div>
        </div>

        {/* Marker detection prompt */}
        {!markerDetected && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "rgba(10,15,13,0.7)",
                backdropFilter: "blur(8px)",
                padding: "1.5rem 2rem",
                borderRadius: "1rem",
                border: "1px solid rgba(34,197,94,0.2)",
                textAlign: "center",
                pointerEvents: "auto",
                maxWidth: "280px",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎯</div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "#f0fdf4", marginBottom: "0.375rem" }}>
                Point at the Hiro marker
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#a3b3a8", lineHeight: 1.5 }}>
                The cooking panel will appear on the marker in AR
              </p>
            </div>
          </div>
        )}

        {/* Spacer when marker IS detected */}
        {markerDetected && <div style={{ flex: 1 }} />}

        {/* Bottom HUD panel */}
        <div
          style={{
            padding: "0.75rem 1rem 1.25rem",
            background: "rgba(10,15,13,0.85)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(34,197,94,0.2)",
            pointerEvents: "auto",
          }}
        >
          {/* Progress bar */}
          <div style={{ width: "100%", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", marginBottom: "0.75rem", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "2px", background: "linear-gradient(90deg, #22c55e, #4ade80)", transition: "width 0.4s ease", width: `${((currentStep) / totalSteps) * 100}%` }} />
          </div>

          {/* Step info */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#4ade80", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Step {currentStep + 1} of {totalSteps}
            </span>
            {step.duration > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: timer.remaining === 0 && timer.total > 0 ? "#4ade80" : "#f0fdf4" }}>
                  ⏱ {formatTime(timer.remaining)}
                </span>
                {timer.remaining > 0 ? (
                  <button
                    onClick={timer.running ? pauseTimer : startTimer}
                    style={{
                      padding: "0.25rem 0.625rem",
                      borderRadius: "0.375rem",
                      border: "1px solid rgba(34,197,94,0.3)",
                      background: "rgba(34,197,94,0.1)",
                      color: "#4ade80",
                      fontWeight: 600,
                      fontSize: "0.6875rem",
                      cursor: "pointer",
                    }}
                  >
                    {timer.running ? "Pause" : "Start"}
                  </button>
                ) : timer.total > 0 ? (
                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#4ade80" }}>✓</span>
                ) : null}
              </div>
            )}
          </div>

          {/* Instruction */}
          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#d1fae5", lineHeight: 1.5, marginBottom: "0.75rem" }}>
            {step.instruction}
          </p>

          {step.optionalTip && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#fb923c",
                backgroundColor: "rgba(251,146,60,0.08)",
                borderLeft: "3px solid rgba(251,146,60,0.5)",
                paddingLeft: "0.625rem",
                paddingTop: "0.25rem",
                paddingBottom: "0.25rem",
                borderRadius: "0 4px 4px 0",
                lineHeight: 1.5,
                marginBottom: "0.75rem",
              }}
            >
              💡 {step.optionalTip}
            </p>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.625rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: currentStep === 0 ? "#3d5046" : "#a3b3a8",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>
            <button
              onClick={goNext}
              style={{
                flex: 2,
                padding: "0.75rem",
                borderRadius: "0.625rem",
                border: "none",
                background: currentStep < totalSteps - 1 ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #f97316, #ea580c)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
              }}
            >
              {currentStep < totalSteps - 1 ? "✓ Next Step" : "🎉 Finish Recipe"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Utility: wrap text for A-Frame (no word-wrap support) ────────────── */

function wrapText(text: string, maxChars: number): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // A-Frame text uses \n for newlines
  return lines.join("\n");
}
