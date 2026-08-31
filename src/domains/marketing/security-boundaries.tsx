"use client";

import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";

import { RevealHeading } from "@/domains/marketing/reveal";
import { SECURITY_BOUNDARIES } from "@/domains/marketing/security-content";

type BoundaryId = (typeof SECURITY_BOUNDARIES)[number]["id"];

export function SecurityBoundaries() {
  const [selectedId, setSelectedId] = useState<BoundaryId>(
    SECURITY_BOUNDARIES[0].id,
  );
  const selectedBoundary =
    SECURITY_BOUNDARIES.find((boundary) => boundary.id === selectedId) ??
    SECURITY_BOUNDARIES[0];

  return (
    <section
      id="security"
      className="security-boundaries-section site-dots relative scroll-mt-24 overflow-hidden bg-site-ink py-[clamp(76px,9vw,132px)] text-site-cream"
    >
      <div className="security-boundaries-orbit" aria-hidden="true" />

      <div className="relative z-[1] mx-auto max-w-[1320px] px-[clamp(20px,3.05vw,44px)]">
        <div className="security-boundaries-intro">
          <div>
            <p className="font-site-mono text-[11px] font-semibold uppercase tracking-[0.17em] text-site-accent">
              Security and boundaries
            </p>
            <RevealHeading
              lead="What Subra stores,"
              accent="and what it deliberately does not."
              className="mt-5 max-w-[18ch] text-[clamp(36px,4.8vw,58px)] leading-[1.04] font-medium tracking-[-0.04em] text-site-cream"
            />
          </div>
          <p>
            Subra is built to record the minimum evidence necessary, not to
            become a second copy of your operational logs.
          </p>
        </div>

        <div className="security-trust-panel">
          <div className="security-trust-panel-heading">
            <span>10 checkable statements</span>
            <strong>Product and security boundaries</strong>
          </div>
          <ol aria-label="Security and product boundaries">
            {SECURITY_BOUNDARIES.map((boundary, index) => (
              <li key={boundary.id}>
                <button
                  type="button"
                  aria-label={boundary.label}
                  aria-pressed={selectedId === boundary.id}
                  aria-controls="security-boundary-detail"
                  onClick={() => setSelectedId(boundary.id)}
                >
                  <span className="security-boundary-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Check aria-hidden="true" />
                  <strong>{boundary.label}</strong>
                  <ChevronRight aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div
          id="security-boundary-detail"
          className="security-boundary-detail"
          aria-live="polite"
          key={selectedBoundary.id}
        >
          <div>
            <span>Technical detail</span>
            <strong>{selectedBoundary.label}</strong>
          </div>
          <p>{selectedBoundary.detail}</p>
        </div>

        <p className="security-boundaries-note">
          Select any statement to inspect its boundary in context.
        </p>
      </div>
    </section>
  );
}
