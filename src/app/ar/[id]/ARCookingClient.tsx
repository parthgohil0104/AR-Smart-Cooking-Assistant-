"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Recipe, CookingStep } from "@/types/recipe";

/* ─── Web Speech API type declarations (not in standard TS lib) ────────────── */
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

interface ISpeechRecognitionResult {
  readonly length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

/* ─── Types ───────────────────────────────────────────────────────────────── */

type ARPhase = "intro" | "ar" | "complete";

interface TimerState {
  remaining: number;
  running: boolean;
  total: number;
}

type VoiceStatus = "idle" | "listening" | "unsupported";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

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
  return lines.join("\n");
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
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastVoiceCmd, setLastVoiceCmd] = useState<string>("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const arContainerRef = useRef<HTMLDivElement>(null);
  const scriptsLoadedRef = useRef(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const currentStepRef = useRef(0); // kept in sync for use inside voice callbacks
  const timerRunningRef = useRef(false);

  const step: CookingStep = recipe.steps[currentStep];
  const totalSteps = recipe.steps.length;

  // Keep refs in sync
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { timerRunningRef.current = timer.running; }, [timer.running]);

  /* ── Body / viewport isolation ────────────────────────────────────────── */
  useEffect(() => {
    if (phase === "ar") {
      document.body.classList.add("ar-active");
      // Prevent pull-to-refresh on mobile
      document.documentElement.style.overscrollBehavior = "none";
    } else {
      document.body.classList.remove("ar-active");
      document.documentElement.style.overscrollBehavior = "";
    }
    return () => {
      document.body.classList.remove("ar-active");
      document.documentElement.style.overscrollBehavior = "";
    };
  }, [phase]);

  /* ── Timer logic ──────────────────────────────────────────────────────── */
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer((prev) => ({ ...prev, running: false }));
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

  const resetTimerForStep = useCallback((stepObj: CookingStep) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer({ remaining: stepObj.duration, running: false, total: stepObj.duration });
  }, []);

  // Reset (but do NOT start) timer when step changes
  useEffect(() => {
    if (step) resetTimerForStep(step);
  }, [currentStep, step, resetTimerForStep]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ── Navigation ───────────────────────────────────────────────────────── */
  const goNext = useCallback((andStartTimer = false) => {
    stopTimer();
    const step = currentStepRef.current;
    if (step < totalSteps - 1) {
      const nextIdx = step + 1;
      setCurrentStep(nextIdx);
      if (andStartTimer) {
        // Schedule timer start after step state updates
        setTimeout(() => {
          if (recipe.steps[nextIdx]?.duration > 0) {
            startTimer();
          }
        }, 150);
      }
    } else {
      exitAR();
      setPhase("complete");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSteps, stopTimer, startTimer]);

  const goPrev = useCallback(() => {
    stopTimer();
    if (currentStepRef.current > 0) setCurrentStep((p) => p - 1);
  }, [stopTimer]);

  /* ── AR Scene teardown ────────────────────────────────────────────────── */
  const exitAR = useCallback(() => {
    // 1. Stop speech recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setVoiceEnabled(false);
    setVoiceStatus("idle");

    // 2. Stop the timer
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer((prev) => ({ ...prev, running: false }));

    // 3. Remove A-Frame scene elements (stops the camera stream)
    const scenes = document.querySelectorAll("a-scene");
    scenes.forEach((s) => {
      // Try gracefully stopping the camera through AR.js internals
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sceneEl = s as any;
        if (sceneEl.systems?.["arjs"]?.arToolkitSource?.domElement) {
          const vid = sceneEl.systems["arjs"].arToolkitSource.domElement as HTMLVideoElement;
          if (vid.srcObject) {
            (vid.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
          }
        }
      } catch { /* ignore */ }
      s.remove();
    });

    // 4. Stop any remaining video/camera tracks on the page
    document.querySelectorAll("video").forEach((v) => {
      if (v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      v.remove();
    });

    // 5. Restore body state
    document.body.classList.remove("ar-active");
    document.documentElement.style.overscrollBehavior = "";
    setMarkerDetected(false);
  }, []);

  /* ── Load A-Frame + AR.js scripts ─────────────────────────────────────── */
  const loadARScripts = useCallback((): Promise<void> => {
    if (scriptsLoadedRef.current) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const aframe = document.createElement("script");
      aframe.src = "https://aframe.io/releases/1.6.0/aframe.min.js";
      aframe.onload = () => {
        const arjs = document.createElement("script");
        arjs.src = "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js";
        arjs.onload = () => { scriptsLoadedRef.current = true; resolve(); };
        arjs.onerror = () => reject(new Error("Failed to load AR.js — check your internet connection"));
        document.head.appendChild(arjs);
      };
      aframe.onerror = () => reject(new Error("Failed to load A-Frame — check your internet connection"));
      document.head.appendChild(aframe);
    });
  }, []);

  /* ── Start AR session ─────────────────────────────────────────────────── */
  const startAR = useCallback(async () => {
    try {
      setArError(null);
      // Request camera permission explicitly for a better UX error message
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        setArError("Camera permission denied. Please allow camera access and try again.");
        return;
      }
      await loadARScripts();
      setPhase("ar");
    } catch (err) {
      setArError(err instanceof Error ? err.message : "Failed to initialize AR");
    }
  }, [loadARScripts]);

  /* ── Build AR scene once entering "ar" phase ──────────────────────────── */
  useEffect(() => {
    if (phase !== "ar" || !arContainerRef.current) return;
    const container = arContainerRef.current;
    if (container.querySelector("a-scene")) return;

    const buildTimeout = setTimeout(() => {
      try {
        /* ── a-scene ── */
        const scene = document.createElement("a-scene");
        // "embedded" makes A-Frame not go fullscreen on its own
        scene.setAttribute("embedded", "");
        scene.setAttribute(
          "arjs",
          "sourceType: webcam; facingMode: environment; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        );
        scene.setAttribute("renderer", "logarithmicDepthBuffer: true; precision: medium; antialias: true;");
        scene.setAttribute("vr-mode-ui", "enabled: false");
        scene.setAttribute("loading-screen", "enabled: false");
        scene.style.cssText =
          "position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;";

        /* ── Hiro marker ── */
        const marker = document.createElement("a-marker");
        marker.setAttribute("preset", "hiro");
        marker.setAttribute("id", "ar-cooking-marker");
        marker.addEventListener("markerFound", () => setMarkerDetected(true));
        marker.addEventListener("markerLost", () => setMarkerDetected(false));

        /*
         * ── AR Panel layout ──────────────────────────────────────────────────
         * The Hiro marker lies flat on a horizontal surface.
         * AR.js origin: Y-axis points UP from the marker centre.
         *
         * Strategy: place all panel elements in a parent entity positioned
         * above the marker (Y = 0.5 → 50 cm above surface). Rotate the
         * parent -90° on X so the panel faces UP (toward the phone camera).
         * Then arrange child text elements in that rotated local space.
         * ─────────────────────────────────────────────────────────────────── */
        const panelEntity = document.createElement("a-entity");
        panelEntity.setAttribute("position", "0 0.01 0");
        panelEntity.setAttribute("rotation", "-90 0 0");
        marker.appendChild(panelEntity);

        // ── Panel background ──
        const panelBg = document.createElement("a-plane");
        panelBg.setAttribute("position", "0 0 0");
        panelBg.setAttribute("width", "2.2");
        panelBg.setAttribute("height", "1.7");
        panelBg.setAttribute("color", "#0d1a10");
        panelBg.setAttribute("opacity", "0.94");
        panelBg.setAttribute("side", "double");
        panelEntity.appendChild(panelBg);

        // ── Green accent bar (top) ──
        const accentTop = document.createElement("a-plane");
        accentTop.setAttribute("position", "0 0.78 0.001");
        accentTop.setAttribute("width", "2.2");
        accentTop.setAttribute("height", "0.07");
        accentTop.setAttribute("color", "#22c55e");
        accentTop.setAttribute("opacity", "0.95");
        panelEntity.appendChild(accentTop);

        // ── "AR COOKING" title ──
        const titleText = document.createElement("a-text");
        titleText.setAttribute("value", "AR COOKING");
        titleText.setAttribute("position", "0 0.6 0.002");
        titleText.setAttribute("align", "center");
        titleText.setAttribute("color", "#22c55e");
        titleText.setAttribute("width", "1.8");
        titleText.setAttribute("font", "mozillavr");
        titleText.setAttribute("id", "ar-title");
        panelEntity.appendChild(titleText);

        // ── Recipe name ──
        const nameText = document.createElement("a-text");
        nameText.setAttribute("value", recipe.name.toUpperCase());
        nameText.setAttribute("position", "0 0.42 0.002");
        nameText.setAttribute("align", "center");
        nameText.setAttribute("color", "#f0fdf4");
        nameText.setAttribute("width", "1.6");
        nameText.setAttribute("font", "mozillavr");
        nameText.setAttribute("id", "ar-recipe-name");
        panelEntity.appendChild(nameText);

        // ── Step counter ──
        const stepText = document.createElement("a-text");
        stepText.setAttribute("value", `STEP 1 OF ${totalSteps}`);
        stepText.setAttribute("position", "0 0.25 0.002");
        stepText.setAttribute("align", "center");
        stepText.setAttribute("color", "#4ade80");
        stepText.setAttribute("width", "1.4");
        stepText.setAttribute("font", "mozillavr");
        stepText.setAttribute("id", "ar-step-counter");
        panelEntity.appendChild(stepText);

        // ── Instruction text ──
        const instrText = document.createElement("a-text");
        instrText.setAttribute("value", wrapText(recipe.steps[0].instruction, 32));
        instrText.setAttribute("position", "0 0.0 0.002");
        instrText.setAttribute("align", "center");
        instrText.setAttribute("color", "#d1fae5");
        instrText.setAttribute("width", "1.5");
        instrText.setAttribute("font", "mozillavr");
        instrText.setAttribute("id", "ar-instruction");
        instrText.setAttribute("baseline", "top");
        instrText.setAttribute("wrap-count", "32");
        panelEntity.appendChild(instrText);

        // ── Timer text ──
        const timerText = document.createElement("a-text");
        timerText.setAttribute(
          "value",
          recipe.steps[0].duration > 0 ? `TIMER: ${formatTime(recipe.steps[0].duration)}` : ""
        );
        timerText.setAttribute("position", "0 -0.45 0.002");
        timerText.setAttribute("align", "center");
        timerText.setAttribute("color", "#fb923c");
        timerText.setAttribute("width", "1.8");
        timerText.setAttribute("font", "mozillavr");
        timerText.setAttribute("id", "ar-timer");
        panelEntity.appendChild(timerText);

        // ── Orange accent bar (bottom) ──
        const accentBottom = document.createElement("a-plane");
        accentBottom.setAttribute("position", "0 -0.79 0.001");
        accentBottom.setAttribute("width", "2.2");
        accentBottom.setAttribute("height", "0.06");
        accentBottom.setAttribute("color", "#f97316");
        accentBottom.setAttribute("opacity", "0.7");
        panelEntity.appendChild(accentBottom);

        // ── Decorative: small cooking pot icon (cylinder) ──
        const pot = document.createElement("a-cylinder");
        pot.setAttribute("position", "0.85 -0.55 0.05");
        pot.setAttribute("radius", "0.08");
        pot.setAttribute("height", "0.06");
        pot.setAttribute("color", "#3d5046");
        pot.setAttribute("metalness", "0.3");
        panelEntity.appendChild(pot);

        // ── Steam animation spheres ──
        const steam1 = document.createElement("a-sphere");
        steam1.setAttribute("position", "-0.02 -0.42 0.05");
        steam1.setAttribute("radius", "0.025");
        steam1.setAttribute("color", "#a3b3a8");
        steam1.setAttribute("opacity", "0.4");
        steam1.setAttribute("animation", "property: position; to: -0.02 -0.28 0.05; dur: 1800; easing: easeOutQuad; loop: true");
        panelEntity.appendChild(steam1);

        const steam2 = document.createElement("a-sphere");
        steam2.setAttribute("position", "0.02 -0.44 0.05");
        steam2.setAttribute("radius", "0.018");
        steam2.setAttribute("color", "#a3b3a8");
        steam2.setAttribute("opacity", "0.3");
        steam2.setAttribute("animation", "property: position; to: 0.02 -0.31 0.05; dur: 2200; easing: easeOutQuad; loop: true; delay: 400");
        panelEntity.appendChild(steam2);

        scene.appendChild(marker);

        // Camera entity
        const camera = document.createElement("a-entity");
        camera.setAttribute("camera", "");
        scene.appendChild(camera);

        container.appendChild(scene);
      } catch (err) {
        setArError(err instanceof Error ? err.message : "Failed to create AR scene");
      }
    }, 600);

    return () => clearTimeout(buildTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Update AR text when step changes ─────────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar") return;
    const updateTimeout = setTimeout(() => {
      const stepEl = document.getElementById("ar-step-counter");
      const instrEl = document.getElementById("ar-instruction");
      const timerEl = document.getElementById("ar-timer");
      if (stepEl) stepEl.setAttribute("value", `STEP ${currentStep + 1} OF ${totalSteps}`);
      if (instrEl) instrEl.setAttribute("value", wrapText(step.instruction, 32));
      if (timerEl) {
        timerEl.setAttribute(
          "value",
          step.duration > 0 ? `TIMER: ${formatTime(step.duration)}` : ""
        );
      }
    }, 120);
    return () => clearTimeout(updateTimeout);
  }, [phase, currentStep, step, totalSteps]);

  /* ── Update AR timer display in real time ─────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar") return;
    const timerEl = document.getElementById("ar-timer");
    if (timerEl && step.duration > 0) {
      const done = timer.remaining === 0 && timer.total > 0;
      timerEl.setAttribute("value", done ? "DONE ✓" : `TIMER: ${formatTime(timer.remaining)}`);
      timerEl.setAttribute("color", done ? "#4ade80" : timer.running ? "#fbbf24" : "#fb923c");
    }
  }, [phase, timer.remaining, timer.total, timer.running, step.duration]);

  /* ── Full AR teardown on unmount ──────────────────────────────────────── */
  useEffect(() => {
    return () => {
      exitAR();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Voice Commands ───────────────────────────────────────────────────── */
  const isSpeechSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const listenOnce = useCallback(() => {
    if (!isSpeechSupported) return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recog = new SpeechRecognitionCtor();
    recognitionRef.current = recog;
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 3;

    setVoiceStatus("listening");

    recog.onresult = (event: ISpeechRecognitionEvent) => {
      const results: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(event.results[0][i].transcript.toLowerCase().trim());
      }
      const transcript = results[0] || "";
      setLastVoiceCmd(transcript);
      handleVoiceCommand(transcript);
      setVoiceStatus("idle");
    };

    recog.onerror = () => { setVoiceStatus("idle"); };
    recog.onend = () => { setVoiceStatus("idle"); };
    recog.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeechSupported]);

  const handleVoiceCommand = useCallback((cmd: string) => {
    if (cmd.includes("next") && (cmd.includes("start") || cmd.includes("timer"))) {
      goNext(true);
    } else if (cmd.includes("next") || cmd === "advance") {
      goNext(false);
    } else if (cmd.includes("previous") || cmd.includes("prev") || cmd.includes("back")) {
      goPrev();
    } else if (cmd.includes("start") && !cmd.includes("next")) {
      startTimer();
    } else if (cmd.includes("stop") || cmd.includes("pause")) {
      stopTimer();
    } else if (cmd.includes("repeat")) {
      // "Repeat" — just re-render; the step text is already shown
      setLastVoiceCmd("Repeating current step…");
    }
  }, [goNext, goPrev, startTimer, stopTimer]);


  const toggleVoice = useCallback(() => {
    if (!isSpeechSupported) return;
    if (voiceEnabled) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      setVoiceEnabled(false);
      setVoiceStatus("idle");
    } else {
      setVoiceEnabled(true);
    }
  }, [voiceEnabled, isSpeechSupported]);

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*   RENDER — INTRO SCREEN                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (phase === "intro") {
    return (
      <>
        <div
          style={{
            minHeight: "100dvh",
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
            <p style={{ fontSize: "0.875rem", color: "#f87171", marginBottom: "1rem", maxWidth: "400px", lineHeight: 1.5 }}>
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
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
          textAlign: "center",
          position: "relative",
          zIndex: 100,
          backgroundColor: "var(--color-surface-900)",
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
            id="completion-view-recipe"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(34,197,94,0.3)",
              backgroundColor: "rgba(34,197,94,0.06)",
              color: "#4ade80",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            📖 View Recipe
          </Link>
          <Link
            href="/recipes"
            id="completion-more-recipes"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
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
      {/* A-Frame AR scene container — sits at z-index 0 */}
      <div
        ref={arContainerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          zIndex: 0,
          overflow: "hidden",
        }}
      />

      {/* HUD Overlay — always on top of the AR camera */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          zIndex: 10,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Top bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.625rem 0.875rem",
            background: "rgba(10,15,13,0.85)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(34,197,94,0.2)",
            pointerEvents: "auto",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <button
              onClick={() => { exitAR(); setPhase("intro"); }}
              style={{ background: "none", border: "none", color: "#a3b3a8", cursor: "pointer", fontSize: "1.125rem", padding: "0.25rem", lineHeight: 1 }}
              aria-label="Exit AR mode"
              id="ar-exit-btn"
            >
              ✕
            </button>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#f0fdf4", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "180px" }}>
              {recipe.name}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {/* Voice toggle */}
            {isSpeechSupported && (
              <button
                onClick={toggleVoice}
                id="ar-voice-toggle"
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  border: `1px solid ${voiceEnabled ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.15)"}`,
                  background: voiceEnabled ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                  color: voiceEnabled ? "#4ade80" : "#6b7f74",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🎙 {voiceEnabled ? "Voice On" : "Voice"}
              </button>
            )}
            {/* Marker status dot */}
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: markerDetected ? "#22c55e" : "#f87171",
                display: "inline-block",
                boxShadow: markerDetected ? "0 0 8px rgba(34,197,94,0.7)" : "none",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                padding: "0.2rem 0.625rem",
                borderRadius: "999px",
                fontSize: "0.65rem",
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

        {/* ── Voice status banner ── */}
        {voiceEnabled && (
          <div
            style={{
              padding: "0.375rem",
              textAlign: "center",
              background: voiceStatus === "listening" ? "rgba(34,197,94,0.2)" : "rgba(10,15,13,0.7)",
              borderBottom: "1px solid rgba(34,197,94,0.15)",
              fontSize: "0.75rem",
              color: voiceStatus === "listening" ? "#4ade80" : "#6b7f74",
              pointerEvents: "none",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            {voiceStatus === "listening"
              ? "🎤 Listening… say a command"
              : lastVoiceCmd
              ? `✓ Heard: "${lastVoiceCmd}"`
              : "Voice control active — press 🎙 Listen to speak"}
          </div>
        )}

        {/* ── Marker detection prompt (centre of screen) ── */}
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
                background: "rgba(10,15,13,0.75)",
                backdropFilter: "blur(8px)",
                padding: "1.5rem 2rem",
                borderRadius: "1rem",
                border: "1px solid rgba(34,197,94,0.2)",
                textAlign: "center",
                pointerEvents: "none",
                maxWidth: "280px",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎯</div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "#f0fdf4", marginBottom: "0.375rem", fontSize: "0.9375rem" }}>
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

        {/* ── Bottom HUD panel ── */}
        <div
          className="ar-hud-bottom"
          style={{
            padding: "0.625rem 0.875rem 1rem",
            background: "rgba(10,15,13,0.9)",
            backdropFilter: "blur(14px)",
            borderTop: "1px solid rgba(34,197,94,0.2)",
            pointerEvents: "auto",
            flexShrink: 0,
          }}
        >
          {/* Progress bar */}
          <div style={{ width: "100%", height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.08)", marginBottom: "0.625rem", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: "2px",
                background: "linear-gradient(90deg, #22c55e, #4ade80)",
                transition: "width 0.4s ease",
                width: `${(currentStep / totalSteps) * 100}%`,
              }}
            />
          </div>

          {/* Step info row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#4ade80", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Step {currentStep + 1} of {totalSteps}
            </span>
            {step.duration > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: timer.remaining === 0 && timer.total > 0 ? "#4ade80" : "#f0fdf4",
                  }}
                >
                  ⏱ {formatTime(timer.remaining)}
                </span>
                {timer.running ? (
                  <button
                    onClick={stopTimer}
                    id="ar-stop-timer"
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid rgba(239,68,68,0.4)",
                      background: "rgba(239,68,68,0.1)",
                      color: "#f87171",
                      fontWeight: 600,
                      fontSize: "0.65rem",
                      cursor: "pointer",
                    }}
                  >
                    Stop
                  </button>
                ) : timer.remaining > 0 ? (
                  <button
                    onClick={startTimer}
                    id="ar-start-timer"
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid rgba(34,197,94,0.4)",
                      background: "rgba(34,197,94,0.1)",
                      color: "#4ade80",
                      fontWeight: 600,
                      fontSize: "0.65rem",
                      cursor: "pointer",
                    }}
                  >
                    Start Timer
                  </button>
                ) : (
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#4ade80" }}>✓ Done</span>
                )}
              </div>
            )}
          </div>

          {/* Instruction */}
          <p
            className="ar-instruction-text"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#d1fae5",
              lineHeight: 1.5,
              marginBottom: step.optionalTip ? "0.5rem" : "0.625rem",
            }}
          >
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
                marginBottom: "0.625rem",
              }}
            >
              💡 {step.optionalTip}
            </p>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: voiceEnabled ? "0.5rem" : 0 }}>
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              id="ar-prev-btn"
              style={{
                flex: 1,
                padding: "0.6875rem",
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
              onClick={() => goNext(false)}
              id="ar-next-btn"
              style={{
                flex: 2,
                padding: "0.6875rem",
                borderRadius: "0.625rem",
                border: "none",
                background:
                  currentStep < totalSteps - 1
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #f97316, #ea580c)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(34,197,94,0.25)",
              }}
            >
              {currentStep < totalSteps - 1 ? "✓ Next Step" : "🎉 Finish Recipe"}
            </button>
          </div>

          {/* Voice listen button (only when voice is enabled) */}
          {voiceEnabled && (
            <button
              onClick={listenOnce}
              disabled={voiceStatus === "listening"}
              id="ar-voice-listen"
              style={{
                width: "100%",
                padding: "0.625rem",
                borderRadius: "0.625rem",
                border: `2px solid ${voiceStatus === "listening" ? "#22c55e" : "rgba(34,197,94,0.3)"}`,
                background: voiceStatus === "listening" ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.07)",
                color: voiceStatus === "listening" ? "#4ade80" : "#a3b3a8",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: voiceStatus === "listening" ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                animation: voiceStatus === "listening" ? "pulseMic 1s ease-in-out infinite" : "none",
              }}
            >
              {voiceStatus === "listening" ? "🎤 Listening…" : "🎙 Listen for Command"}
            </button>
          )}
        </div>

        {/* Voice unsupported notice (show once when user opens voice for the first time) */}
        {!isSpeechSupported && (
          <div
            style={{
              position: "fixed",
              bottom: "1rem",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(30,30,30,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.25rem",
              fontSize: "0.8125rem",
              color: "#a3b3a8",
              textAlign: "center",
              maxWidth: "300px",
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            Voice control is not supported on this browser. Use the touch controls instead.
          </div>
        )}
      </div>

      {/* AR-mode styles */}
      <style>{`
        @keyframes pulseMic {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }

        /* Landscape: compact HUD so camera view is larger */
        @media (orientation: landscape) and (max-height: 500px) {
          .ar-hud-bottom {
            padding: 0.375rem 0.875rem 0.5rem !important;
          }
          .ar-instruction-text {
            font-size: 0.8125rem !important;
            margin-bottom: 0.375rem !important;
            /* Clamp to 2 lines in landscape */
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
        }

        /* Prevent A-Frame from injecting its own fullscreen button */
        .a-enter-vr { display: none !important; }
        .a-loader-title { display: none !important; }
      `}</style>
    </>
  );
}
