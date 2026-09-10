"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ─── jsQR type (loaded dynamically via CDN) ─────────────────────────────── */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsQR?: (data: Uint8ClampedArray, width: number, height: number, options?: any) => { data: string } | null;
  }
}

type ScanStatus =
  | "idle"
  | "requesting"
  | "scanning"
  | "detected"
  | "navigating"
  | "error-permission"
  | "error-camera"
  | "error-browser"
  | "error-invalid-qr";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Parses a QR code value and extracts a recipe path.
 * Accepts:
 *   - https://ar-smart-cooking-assistant.vercel.app/recipe/recipe-*
 *   - https://arcook.app/recipe/recipe-*
 *   - https://*.vercel.app/recipe/recipe-*
 *   - /recipe/recipe-*
 *   - recipe-*   (bare ID)
 */
function extractRecipePath(raw: string): string | null {
  const trimmed = raw.trim();

  // Full URL: extract pathname
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/^(\/recipe\/[^/?#]+)/);
    if (match) return match[1];
  } catch {
    // Not a valid URL — check if it's a relative path or bare ID
  }

  // Relative path
  const relMatch = trimmed.match(/^(\/recipe\/[^/?#\s]+)/);
  if (relMatch) return relMatch[1];

  // Bare recipe ID (e.g. "recipe-masala-maggi")
  if (/^recipe-[a-z0-9-]+$/.test(trimmed)) {
    return `/recipe/${trimmed}`;
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  COMPONENT                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function QRScannerClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jsQRLoadedRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [detectedUrl, setDetectedUrl] = useState<string>("");

  /* ── Cleanup ─────────────────────────────────────────────────────────── */
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  /* ── Load jsQR from CDN ──────────────────────────────────────────────── */
  const loadJsQR = useCallback((): Promise<void> => {
    if (jsQRLoadedRef.current && window.jsQR) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
      s.onload = () => { jsQRLoadedRef.current = true; resolve(); };
      s.onerror = () => reject(new Error("Failed to load QR library"));
      document.head.appendChild(s);
    });
  }, []);

  /* ── Scan loop ───────────────────────────────────────────────────────── */
  const startScanLoop = useCallback(() => {
    if (scanLoopRef.current) clearInterval(scanLoopRef.current);

    scanLoopRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      if (!window.jsQR) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (result?.data) {
        clearInterval(scanLoopRef.current!);
        scanLoopRef.current = null;

        const recipePath = extractRecipePath(result.data);
        if (recipePath) {
          setDetectedUrl(recipePath);
          setStatus("navigating");
          stopCamera();
          // Small delay so user sees the "detected" flash
          setTimeout(() => {
            router.push(recipePath);
          }, 600);
        } else {
          // Not a recipe QR — restart scan after a moment
          setStatus("error-invalid-qr");
          setTimeout(() => {
            setStatus("scanning");
            startScanLoop();
          }, 2500);
        }
      }
    }, 150);
  }, [router, stopCamera]);

  /* ── Start scanning ──────────────────────────────────────────────────── */
  const startScanning = useCallback(async () => {
    setStatus("requesting");
    setDetectedUrl("");

    try {
      await loadJsQR();
    } catch {
      setStatus("error-browser");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setStatus("error-permission");
      } else {
        setStatus("error-camera");
      }
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    setStatus("scanning");
    startScanLoop();
  }, [loadJsQR, startScanLoop]);

  /* ── Auto-start on mount ─────────────────────────────────────────────── */
  useEffect(() => {
    // Check basic API support first
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error-browser");
      return;
    }
    startScanning();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Derived UI state ─────────────────────────────────────────────── */
  const isScanning = status === "scanning";
  const isLoading = status === "requesting";
  const isNavigating = status === "navigating";
  const hasError = status.startsWith("error-");
  const cameraActive = status === "scanning" || status === "navigating";

  const errorMessages: Record<string, string> = {
    "error-permission": "Camera permission denied. Please allow camera access in your browser settings and try again.",
    "error-camera": "Camera is unavailable. Make sure no other app is using it.",
    "error-browser": "Your browser does not support camera access. Please use Chrome or Safari on a modern device.",
    "error-invalid-qr": "QR code detected but it doesn't look like a recipe. Scanning again…",
  };

  /* ─── Render ──────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px - 200px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
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
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Heading */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
          fontWeight: 800,
          color: "#f0fdf4",
          letterSpacing: "-0.025em",
          marginBottom: "0.5rem",
          position: "relative",
        }}
      >
        Scan Recipe
      </h1>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "#a3b3a8",
          marginBottom: "1.75rem",
          position: "relative",
        }}
      >
        Point your camera at a recipe QR code.
      </p>

      {/* Camera / scanner viewport */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          aspectRatio: "1 / 1",
          borderRadius: "1.25rem",
          overflow: "hidden",
          border: "2px solid rgba(34,197,94,0.25)",
          backgroundColor: "#0a0f0d",
          boxShadow: "0 0 40px rgba(34,197,94,0.1)",
          marginBottom: "1.5rem",
        }}
      >
        {/* Live video feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: cameraActive ? "block" : "none",
          }}
        />

        {/* Hidden canvas used for QR decoding */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Scanning frame overlay */}
        {isScanning && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {/* Corner brackets */}
            {(["tl", "tr", "bl", "br"] as const).map((corner) => (
              <div
                key={corner}
                style={{
                  position: "absolute",
                  width: "48px",
                  height: "48px",
                  ...(corner.includes("t") ? { top: "16px" } : { bottom: "16px" }),
                  ...(corner.includes("l") ? { left: "16px" } : { right: "16px" }),
                  borderColor: "#22c55e",
                  borderStyle: "solid",
                  borderWidth: 0,
                  borderTopWidth: corner.includes("t") ? "3px" : 0,
                  borderBottomWidth: corner.includes("b") ? "3px" : 0,
                  borderLeftWidth: corner.includes("l") ? "3px" : 0,
                  borderRightWidth: corner.includes("r") ? "3px" : 0,
                  borderTopLeftRadius: corner === "tl" ? "6px" : 0,
                  borderTopRightRadius: corner === "tr" ? "6px" : 0,
                  borderBottomLeftRadius: corner === "bl" ? "6px" : 0,
                  borderBottomRightRadius: corner === "br" ? "6px" : 0,
                }}
              />
            ))}

            {/* Scanning line animation */}
            <div
              style={{
                position: "absolute",
                left: "20px",
                right: "20px",
                height: "2px",
                background: "linear-gradient(90deg, transparent, #22c55e, transparent)",
                animation: "scanLine 2s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {/* Success overlay */}
        {isNavigating && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10,15,13,0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ fontSize: "3rem" }}>✅</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#4ade80", fontSize: "1rem" }}>
              QR Detected!
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#a3b3a8" }}>
              Opening recipe…
            </p>
          </div>
        )}

        {/* Loading / requesting overlay */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              background: "#0a0f0d",
            }}
          >
            <div style={{ fontSize: "2.5rem", animation: "spin 1.5s linear infinite" }}>📷</div>
            <p style={{ fontSize: "0.875rem", color: "#a3b3a8" }}>Requesting camera…</p>
          </div>
        )}

        {/* Error / idle placeholder */}
        {!cameraActive && !isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ fontSize: "3rem" }}>📷</div>
            <p style={{ fontSize: "0.8125rem", color: "#6b7f74", maxWidth: "220px", lineHeight: 1.5 }}>
              {status === "idle" ? "Camera will appear here" : "Camera stopped"}
            </p>
          </div>
        )}
      </div>

      {/* Status text */}
      <p
        style={{
          fontSize: "0.875rem",
          color: isScanning ? "#4ade80" : isNavigating ? "#4ade80" : hasError ? "#f87171" : "#a3b3a8",
          marginBottom: hasError ? "1rem" : "1.5rem",
          maxWidth: "380px",
          lineHeight: 1.6,
          fontWeight: isScanning ? 500 : 400,
          minHeight: "1.5em",
        }}
      >
        {isLoading && "Requesting camera access…"}
        {isScanning && "● Scanning for QR code…"}
        {isNavigating && `✓ Recipe found! Navigating to ${detectedUrl}`}
        {hasError && errorMessages[status]}
      </p>

      {/* Try Again button on terminal errors */}
      {(status === "error-permission" || status === "error-camera" || status === "error-browser") && (
        <button
          onClick={startScanning}
          id="scan-try-again"
          style={{
            padding: "0.75rem 1.75rem",
            borderRadius: "0.625rem",
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9375rem",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
            marginBottom: "1.5rem",
          }}
        >
          Try Again
        </button>
      )}

      {/* Tips */}
      {isScanning && (
        <div
          style={{
            maxWidth: "380px",
            padding: "1rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(34,197,94,0.1)",
            backgroundColor: "rgba(34,197,94,0.04)",
            textAlign: "left",
          }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4ade80", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tips
          </p>
          <ul style={{ fontSize: "0.8125rem", color: "#a3b3a8", lineHeight: 1.7, paddingLeft: "1rem" }}>
            <li>Hold the QR code steady in good lighting</li>
            <li>Fill the frame with the QR code</li>
            <li>Keep about 20–30 cm distance from the screen</li>
          </ul>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 20px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 20px); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
