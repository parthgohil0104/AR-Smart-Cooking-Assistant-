"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Recipe, CookingStep } from "@/types/recipe";

/* ─── Web Speech API type declarations ─────────────────────────────────────── */
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AFRAME?: any;
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

/* ─── Types ─────────────────────────────────────────────────────────────────── */

type ARPhase = "loading" | "ar" | "complete";

interface TimerState {
  remaining: number;
  running: boolean;
  total: number;
}

type VoiceStatus = "idle" | "listening" | "unsupported";

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

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
/*  COMPONENT                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function ARCookingClient({ recipe }: { recipe: Recipe }) {
  /* ── State ──────────────────────────────────────────────────────────────── */
  const [phase, setPhase] = useState<ARPhase>("loading");
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
  const currentStepRef = useRef(0);
  const timerRunningRef = useRef(false);

  const step: CookingStep = recipe.steps[currentStep];
  const totalSteps = recipe.steps.length;

  // Keep refs in sync
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { timerRunningRef.current = timer.running; }, [timer.running]);

  /* ── Body / viewport isolation ─────────────────────────────────────────── */
  useEffect(() => {
    if (phase === "ar") {
      document.body.classList.add("ar-active");
      document.documentElement.classList.add("ar-active");
      document.documentElement.style.overscrollBehavior = "none";
    } else {
      document.body.classList.remove("ar-active");
      document.documentElement.classList.remove("ar-active");
      document.documentElement.style.overscrollBehavior = "";
    }
    return () => {
      document.body.classList.remove("ar-active");
      document.documentElement.classList.remove("ar-active");
      document.documentElement.style.overscrollBehavior = "";
    };
  }, [phase]);

  /* ── Auto-start AR when the tab loads ──────────────────────────────────── */
  useEffect(() => {
    // The preparation screen is shown on the recipe page before this tab opens.
    // This tab should go straight to camera without any intro screen.
    startAR();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Timer logic ────────────────────────────────────────────────────────── */
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

  useEffect(() => {
    if (step) resetTimerForStep(step);
  }, [currentStep, step, resetTimerForStep]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ── Navigation ─────────────────────────────────────────────────────────── */
  const goNext = useCallback((andStartTimer = false) => {
    stopTimer();
    const step = currentStepRef.current;
    if (step < totalSteps - 1) {
      const nextIdx = step + 1;
      setCurrentStep(nextIdx);
      if (andStartTimer) {
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

  /* ── AR Scene teardown ──────────────────────────────────────────────────── */
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

    // 3. Stop camera streams on all video elements
    document.querySelectorAll("video").forEach((v) => {
      if (v.srcObject) {
        try {
          (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        } catch { /* ignore */ }
      }
      try { v.srcObject = null; } catch { /* ignore */ }
    });

    // 4. Remove A-Frame scenes (also stops any remaining camera via AR.js)
    document.querySelectorAll("a-scene").forEach((s) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sceneEl = s as any;
        if (sceneEl.systems?.["arjs"]?.arToolkitSource?.domElement) {
          const vid = sceneEl.systems["arjs"].arToolkitSource.domElement as HTMLVideoElement;
          if (vid.srcObject) {
            (vid.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
          }
        }
        if (typeof sceneEl.destroy === "function") sceneEl.destroy();
      } catch { /* ignore */ }
      try { s.remove(); } catch { /* ignore */ }
    });

    // 5. Remove any leftover AR.js-injected video/canvas elements
    document.querySelectorAll("video").forEach((v) => {
      if (v.srcObject) {
        try {
          (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        } catch { /* ignore */ }
      }
      try { v.remove(); } catch { /* ignore */ }
    });
    document.querySelectorAll("canvas").forEach((c) => {
      // Only remove canvases that AR.js added (not ones inside React-managed elements)
      if (!c.closest("[data-ar-managed]")) {
        try { c.remove(); } catch { /* ignore */ }
      }
    });

    // 6. Restore body/html state
    document.body.classList.remove("ar-active");
    document.documentElement.classList.remove("ar-active");
    document.documentElement.style.overscrollBehavior = "";
    setMarkerDetected(false);
  }, []);

  /* ── Load A-Frame + AR.js scripts ──────────────────────────────────────── */
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

  /* ── Start AR session ───────────────────────────────────────────────────── */
  const startAR = useCallback(async () => {
    try {
      setArError(null);
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

  /* ── Register distance-scaling A-Frame component ──────────────────────── */
  const registerDistanceScaler = useCallback(() => {
    if (!window.AFRAME || window.AFRAME.components["distance-scaler"]) return;

    window.AFRAME.registerComponent("distance-scaler", {
      schema: {
        min: { type: "number", default: 0.7 },
        max: { type: "number", default: 2.8 },
        baseDistance: { type: "number", default: 1.2 },
        lerpSpeed: { type: "number", default: 0.08 },
      },
      init() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.currentScale = 1.0 as any;
        this.camera = null;
      },
      tick() {
        if (!this.camera) {
          this.camera = document.querySelector("[camera]");
          if (!this.camera) return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const camPos = (this.camera as any).object3D?.position;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myPos = (this.el as any).object3D?.position;
        if (!camPos || !myPos) return;

        const dx = camPos.x - myPos.x;
        const dy = camPos.y - myPos.y;
        const dz = camPos.z - myPos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Compute target scale: at baseDistance → scale 1.0; farther → bigger; closer → smaller
        const ratio = dist / this.data.baseDistance;
        // Use sqrt to soften the scaling curve
        const rawTarget = Math.sqrt(ratio);
        const targetScale = Math.max(this.data.min, Math.min(this.data.max, rawTarget));

        // Smooth lerp toward target
        this.currentScale = this.currentScale + (targetScale - this.currentScale) * this.data.lerpSpeed;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj3d = (this.el as any).object3D;
        if (obj3d) {
          obj3d.scale.set(this.currentScale, this.currentScale, this.currentScale);
        }
      },
    });
  }, []);

  /* ── Build AR scene once entering "ar" phase ────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar" || !arContainerRef.current) return;
    const container = arContainerRef.current;
    if (container.querySelector("a-scene")) return;

    const buildTimeout = setTimeout(() => {
      try {
        // Register the distance-scaler component if AFRAME is ready
        registerDistanceScaler();

        /* ── a-scene ── */
        const scene = document.createElement("a-scene");
        scene.setAttribute("embedded", "");
        scene.setAttribute(
          "arjs",
          "sourceType: webcam; facingMode: environment; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; smoothCount: 10; smoothTolerance: 0.01; smoothThreshold: 5;"
        );
        scene.setAttribute("renderer", "logarithmicDepthBuffer: true; precision: medium; antialias: true;");
        scene.setAttribute("vr-mode-ui", "enabled: false");
        scene.setAttribute("loading-screen", "enabled: false");
        // Explicitly size the scene to full viewport
        scene.style.cssText =
          "position:fixed;top:0;left:0;width:100vw;height:100dvh;z-index:0;overflow:hidden;";

        /* ── Hiro marker ── */
        const marker = document.createElement("a-marker");
        marker.setAttribute("preset", "hiro");
        marker.setAttribute("id", "ar-cooking-marker");
        marker.setAttribute("smooth", "true");
        marker.setAttribute("smoothCount", "10");
        marker.setAttribute("smoothTolerance", "0.01");
        marker.setAttribute("smoothThreshold", "5");
        marker.addEventListener("markerFound", () => setMarkerDetected(true));
        marker.addEventListener("markerLost", () => setMarkerDetected(false));

        /*
         * ── AR Panel layout ───────────────────────────────────────────────────
         * The Hiro marker lies FLAT on a horizontal surface.
         * AR.js: Y-axis points UP from the marker centre.
         *
         * panelEntity is positioned 5 cm above the marker surface (Y=0.05)
         * and rotated -90° on X so the panel faces UPWARD toward the camera.
         *
         * distance-scaler component handles dynamic scale based on camera distance.
         * ─────────────────────────────────────────────────────────────────────── */
        const panelEntity = document.createElement("a-entity");
        panelEntity.setAttribute("position", "0 0.05 0");
        panelEntity.setAttribute("rotation", "-90 0 0");
        // distance-scaler: min=0.7, max=2.8, baseDistance=1.2m, lerp=0.08
        panelEntity.setAttribute("distance-scaler", "min: 0.7; max: 2.8; baseDistance: 1.2; lerpSpeed: 0.08");
        marker.appendChild(panelEntity);

        /* ── Panel background ── */
        const panelBg = document.createElement("a-plane");
        panelBg.setAttribute("position", "0 0 0");
        panelBg.setAttribute("width", "2.8");
        panelBg.setAttribute("height", "2.2");
        panelBg.setAttribute("color", "#0a0f0d");
        panelBg.setAttribute("opacity", "0.95");
        panelBg.setAttribute("side", "double");
        panelEntity.appendChild(panelBg);

        /* ── Border frame ── */
        const borderFrame = document.createElement("a-plane");
        borderFrame.setAttribute("position", "0 0 -0.001");
        borderFrame.setAttribute("width", "2.84");
        borderFrame.setAttribute("height", "2.24");
        borderFrame.setAttribute("color", "#22c55e");
        borderFrame.setAttribute("opacity", "0.3");
        borderFrame.setAttribute("side", "double");
        panelEntity.appendChild(borderFrame);

        /* ── Green accent bar (top) ── */
        const accentTop = document.createElement("a-plane");
        accentTop.setAttribute("position", "0 1.02 0.001");
        accentTop.setAttribute("width", "2.8");
        accentTop.setAttribute("height", "0.1");
        accentTop.setAttribute("color", "#22c55e");
        accentTop.setAttribute("opacity", "0.95");
        panelEntity.appendChild(accentTop);

        /* ── "AR COOKING" label ── */
        const titleText = document.createElement("a-text");
        titleText.setAttribute("value", "AR COOKING");
        titleText.setAttribute("position", "0 0.82 0.002");
        titleText.setAttribute("align", "center");
        titleText.setAttribute("color", "#22c55e");
        titleText.setAttribute("width", "2.2");
        titleText.setAttribute("font", "mozillavr");
        titleText.setAttribute("id", "ar-title");
        panelEntity.appendChild(titleText);

        /* ── Recipe name ── */
        const nameText = document.createElement("a-text");
        nameText.setAttribute("value", recipe.name.toUpperCase());
        nameText.setAttribute("position", "0 0.58 0.002");
        nameText.setAttribute("align", "center");
        nameText.setAttribute("color", "#f0fdf4");
        nameText.setAttribute("width", "2.4");
        nameText.setAttribute("font", "mozillavr");
        nameText.setAttribute("id", "ar-recipe-name");
        panelEntity.appendChild(nameText);

        /* ── Divider line ── */
        const divider = document.createElement("a-plane");
        divider.setAttribute("position", "0 0.42 0.001");
        divider.setAttribute("width", "2.4");
        divider.setAttribute("height", "0.015");
        divider.setAttribute("color", "#22c55e");
        divider.setAttribute("opacity", "0.4");
        panelEntity.appendChild(divider);

        /* ── Step counter ── */
        const stepText = document.createElement("a-text");
        stepText.setAttribute("value", `STEP 1 OF ${totalSteps}`);
        stepText.setAttribute("position", "0 0.28 0.002");
        stepText.setAttribute("align", "center");
        stepText.setAttribute("color", "#4ade80");
        stepText.setAttribute("width", "2.0");
        stepText.setAttribute("font", "mozillavr");
        stepText.setAttribute("id", "ar-step-counter");
        panelEntity.appendChild(stepText);

        /* ── Instruction text ── */
        const instrText = document.createElement("a-text");
        instrText.setAttribute("value", wrapText(recipe.steps[0].instruction, 30));
        instrText.setAttribute("position", "0 -0.05 0.002");
        instrText.setAttribute("align", "center");
        instrText.setAttribute("color", "#d1fae5");
        instrText.setAttribute("width", "2.4");
        instrText.setAttribute("font", "mozillavr");
        instrText.setAttribute("id", "ar-instruction");
        instrText.setAttribute("baseline", "top");
        instrText.setAttribute("wrap-count", "30");
        panelEntity.appendChild(instrText);

        /* ── Timer text ── */
        const timerText = document.createElement("a-text");
        timerText.setAttribute(
          "value",
          recipe.steps[0].duration > 0 ? `TIMER: ${formatTime(recipe.steps[0].duration)}` : ""
        );
        timerText.setAttribute("position", "0 -0.72 0.002");
        timerText.setAttribute("align", "center");
        timerText.setAttribute("color", "#fb923c");
        timerText.setAttribute("width", "2.2");
        timerText.setAttribute("font", "mozillavr");
        timerText.setAttribute("id", "ar-timer");
        panelEntity.appendChild(timerText);

        /* ── Orange accent bar (bottom) ── */
        const accentBottom = document.createElement("a-plane");
        accentBottom.setAttribute("position", "0 -1.04 0.001");
        accentBottom.setAttribute("width", "2.8");
        accentBottom.setAttribute("height", "0.08");
        accentBottom.setAttribute("color", "#f97316");
        accentBottom.setAttribute("opacity", "0.7");
        panelEntity.appendChild(accentBottom);

        scene.appendChild(marker);

        /* ── Camera entity ── */
        const camera = document.createElement("a-entity");
        camera.setAttribute("camera", "");
        scene.appendChild(camera);

        container.appendChild(scene);

        // If AFRAME already initialised before scene was added, try registering now
        setTimeout(() => registerDistanceScaler(), 800);
      } catch (err) {
        setArError(err instanceof Error ? err.message : "Failed to create AR scene");
      }
    }, 600);

    return () => clearTimeout(buildTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Update AR text when step changes ──────────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar") return;
    const updateTimeout = setTimeout(() => {
      const stepEl = document.getElementById("ar-step-counter");
      const instrEl = document.getElementById("ar-instruction");
      const timerEl = document.getElementById("ar-timer");
      if (stepEl) stepEl.setAttribute("value", `STEP ${currentStep + 1} OF ${totalSteps}`);
      if (instrEl) instrEl.setAttribute("value", wrapText(step.instruction, 30));
      if (timerEl) {
        timerEl.setAttribute(
          "value",
          step.duration > 0 ? `TIMER: ${formatTime(step.duration)}` : ""
        );
      }
    }, 120);
    return () => clearTimeout(updateTimeout);
  }, [phase, currentStep, step, totalSteps]);

  /* ── Update AR timer display in real time ───────────────────────────────── */
  useEffect(() => {
    if (phase !== "ar") return;
    const timerEl = document.getElementById("ar-timer");
    if (timerEl && step.duration > 0) {
      const done = timer.remaining === 0 && timer.total > 0;
      timerEl.setAttribute("value", done ? "DONE ✓" : `TIMER: ${formatTime(timer.remaining)}`);
      timerEl.setAttribute("color", done ? "#4ade80" : timer.running ? "#fbbf24" : "#fb923c");
    }
  }, [phase, timer.remaining, timer.total, timer.running, step.duration]);

  /* ── Full AR teardown on unmount ────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      exitAR();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Voice Commands ─────────────────────────────────────────────────────── */
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
  /*   RENDER — LOADING / ERROR SCREEN                                     */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (phase === "loading") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0f0d",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        {arError ? (
          /* ── Error state ── */
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#f0fdf4",
                marginBottom: "0.75rem",
              }}
            >
              Camera Error
            </h1>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "#f87171",
                maxWidth: "360px",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              {arError}
            </p>
            <button
              onClick={startAR}
              id="retry-ar-btn"
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                marginBottom: "1rem",
                fontFamily: "inherit",
              }}
            >
              Try Again
            </button>
            <p style={{ fontSize: "0.8125rem", color: "#6b7f74" }}>
              You can close this tab and try again from the recipe page.
            </p>
          </>
        ) : (
          /* ── Loading state ── */
          <>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                border: "3px solid rgba(34,197,94,0.2)",
                borderTopColor: "#22c55e",
                animation: "arSpin 0.9s linear infinite",
                marginBottom: "1.5rem",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "1rem",
                color: "#4ade80",
                marginBottom: "0.375rem",
              }}
            >
              Starting AR…
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#6b7f74" }}>
              Allow camera access when prompted
            </p>
          </>
        )}
        <style>{`
          @keyframes arSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*   RENDER — COMPLETION SCREEN                                          */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (phase === "complete") {
    return (
      <div
        data-ar-managed="completion"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.25rem",
          textAlign: "center",
          zIndex: 200,
          backgroundColor: "var(--color-surface-900)",
          overflowY: "auto",
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

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 201 }}>
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
  /*   RENDER — AR MODE (A-Frame + AR.js scene with HUD overlay)           */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <>
      {/* A-Frame AR scene container — sits at z-index 0, fixed full-screen */}
      <div
        ref={arContainerRef}
        data-ar-managed="scene"
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
              onClick={() => { exitAR(); try { window.close(); } catch { /* ignore */ } setPhase("complete"); }}
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

          {/* Voice listen button */}
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
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
        }

        /* Prevent A-Frame from injecting its own fullscreen button */
        .a-enter-vr { display: none !important; }
        .a-loader-title { display: none !important; }
        .a-orientation-modal { display: none !important; }
      `}</style>
    </>
  );
}
