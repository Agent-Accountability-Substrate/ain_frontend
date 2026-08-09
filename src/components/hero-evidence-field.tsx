"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

const LEDGER_WIDTH = 1200;
const LEDGER_HEIGHT = 520;
const HORIZON_Y = 190;
const LEDGER_ROWS = Array.from({ length: 12 }, (_, index) => {
  const progress = (index + 1) / 12;

  return {
    halfWidth: 560 * progress,
    y: HORIZON_Y + (LEDGER_HEIGHT - HORIZON_Y) * progress ** 2,
  };
});
const LEDGER_COLUMNS = [40, 180, 320, 460, 600, 740, 880, 1020, 1160];
const APERTURE_BLADES = Array.from({ length: 6 }, (_, index) => index * 60);

const EVIDENCE_TRAILS = [
  {
    angle: -31.8,
    delay: "900ms",
    distance: 588,
    duration: "7s",
    id: "primary",
    startX: 100,
    startY: 500,
  },
  {
    angle: -148.2,
    delay: "1.3s",
    distance: 588,
    duration: "9.5s",
    id: "secondary",
    startX: 1100,
    startY: 500,
  },
  {
    angle: -15.6,
    delay: "1.7s",
    distance: 581,
    duration: "13s",
    id: "tertiary",
    startX: 40,
    startY: 348,
  },
] as const;

type TrailStyle = CSSProperties & {
  "--trail-delay": string;
  "--trail-distance": string;
  "--trail-duration": string;
};

export function HeroEvidenceField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;

    if (!field) {
      return;
    }

    if (typeof window.matchMedia !== "function") {
      return;
    }

    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const desktopViewport = window.matchMedia("(min-width: 640px)");
    let enabled = false;
    let frameId: number | null = null;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const drawFrame = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      field.style.setProperty("--ledger-x", `${currentX.toFixed(2)}px`);
      field.style.setProperty("--ledger-y", `${currentY.toFixed(2)}px`);

      if (
        Math.abs(targetX - currentX) > 0.01 ||
        Math.abs(targetY - currentY) > 0.01
      ) {
        frameId = window.requestAnimationFrame(drawFrame);
      } else {
        frameId = null;
      }
    };

    const queueFrame = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    const resetLedger = () => {
      targetX = 0;
      targetY = 0;
      queueFrame();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      const bounds = field.getBoundingClientRect();
      const isInside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;

      if (!isInside) {
        resetLedger();
        return;
      }

      const normalX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const normalY = (event.clientY - bounds.top) / bounds.height - 0.5;
      targetX = normalX * 8;
      targetY = normalY * 6;
      queueFrame();
    };

    const syncPointerTracking = () => {
      const shouldEnable =
        finePointer.matches &&
        desktopViewport.matches &&
        !reducedMotion.matches;

      if (shouldEnable === enabled) {
        return;
      }

      enabled = shouldEnable;

      if (enabled) {
        window.addEventListener("pointermove", handlePointerMove, {
          passive: true,
        });
      } else {
        window.removeEventListener("pointermove", handlePointerMove);
        resetLedger();
      }
    };

    finePointer.addEventListener("change", syncPointerTracking);
    desktopViewport.addEventListener("change", syncPointerTracking);
    reducedMotion.addEventListener("change", syncPointerTracking);
    syncPointerTracking();

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      finePointer.removeEventListener("change", syncPointerTracking);
      desktopViewport.removeEventListener("change", syncPointerTracking);
      reducedMotion.removeEventListener("change", syncPointerTracking);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      aria-hidden="true"
      className="hero-evidence-field hero-evidence-field-v2"
      data-testid="hero-evidence-field"
    >
      <span className="hero-resolver-glow" />

      <svg
        className="hero-evidence-ledger"
        viewBox={`0 0 ${LEDGER_WIDTH} ${LEDGER_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <g className="hero-ledger-plane" data-testid="hero-ledger-plane">
          {LEDGER_ROWS.map((row, index) => (
            <line
              key={index}
              className="hero-ledger-row"
              data-ledger-row={index}
              data-ledger-y={row.y.toFixed(2)}
              x1={LEDGER_WIDTH / 2 - row.halfWidth}
              x2={LEDGER_WIDTH / 2 + row.halfWidth}
              y1={row.y}
              y2={row.y}
            />
          ))}
          {LEDGER_COLUMNS.map((x) => (
            <line
              key={x}
              className="hero-ledger-column"
              x1={x}
              x2={LEDGER_WIDTH / 2}
              y1={LEDGER_HEIGHT}
              y2={HORIZON_Y}
            />
          ))}
        </g>

        <g className="hero-evidence-trails" data-testid="hero-evidence-trails">
          {EVIDENCE_TRAILS.map((trail) => {
            const style = {
              "--trail-delay": trail.delay,
              "--trail-distance": `${(trail.distance / LEDGER_WIDTH) * 100}%`,
              "--trail-duration": trail.duration,
            } as TrailStyle;

            return (
              <g
                key={trail.id}
                className={`hero-evidence-trail hero-evidence-trail-${trail.id}`}
                data-trail={trail.id}
                style={style}
                transform={`translate(${trail.startX} ${trail.startY}) rotate(${trail.angle})`}
              >
                <g className="hero-evidence-signal">
                  <line className="hero-evidence-signal-blue" x1="-92" x2="0" />
                  <line
                    className="hero-evidence-signal-orange"
                    x1="-92"
                    x2="0"
                  />
                  <circle
                    className="hero-evidence-signal-point hero-evidence-signal-point-blue"
                    r="3.25"
                  />
                  <circle
                    className="hero-evidence-signal-point hero-evidence-signal-point-orange"
                    r="3.25"
                  />
                </g>
              </g>
            );
          })}
        </g>

        <g
          className="hero-verification-aperture"
          data-testid="hero-verification-aperture"
          transform={`translate(${LEDGER_WIDTH / 2} ${HORIZON_Y})`}
        >
          <g className="hero-aperture-blades">
            {APERTURE_BLADES.map((angle) => (
              <g key={angle} transform={`rotate(${angle})`}>
                <line className="hero-aperture-blade" x1="13" x2="31" />
              </g>
            ))}
          </g>
          <circle className="hero-aperture-point" r="4" />
          <circle className="hero-aperture-confirmation" r="16" />
        </g>
      </svg>
    </div>
  );
}
