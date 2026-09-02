"use client";

import { useEffect, useState, type FocusEvent } from "react";

const PARTNER_LANES = [
  { id: "platforms", label: "AI Platforms" },
  { id: "regulated", label: "Regulated Firms" },
  { id: "assurance", label: "Assurance Partners" },
  { id: "featured", label: "Get Featured" },
] as const;

function PartnerMark({ lane }: { lane: (typeof PARTNER_LANES)[number] }) {
  return (
    <span className="partner-carousel-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18.5" stroke="currentColor" />
        {lane.id === "platforms" ? (
          <>
            <circle cx="20" cy="13" r="2.5" fill="currentColor" />
            <circle cx="13.5" cy="25" r="2.5" fill="currentColor" />
            <circle cx="26.5" cy="25" r="2.5" fill="currentColor" />
            <path
              d="M18.7 15.3 14.8 22.7M21.3 15.3l3.9 7.4M16 25h8"
              stroke="currentColor"
            />
          </>
        ) : lane.id === "regulated" ? (
          <>
            <path
              d="m12 16 8-5 8 5M13.5 17.5h13M15 18.5v8M20 18.5v8M25 18.5v8M12.5 28h15"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : lane.id === "assurance" ? (
          <>
            <path
              d="M20 10.5 28 14v6.2c0 5-3.4 8-8 9.3-4.6-1.3-8-4.3-8-9.3V14l8-3.5Z"
              stroke="currentColor"
              strokeLinejoin="round"
            />
            <path
              d="m16.2 20.2 2.5 2.5 5.2-5.4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <path
              d="m20 10.8 2.5 5.8 6.3.6-4.8 4.2 1.4 6.1-5.4-3.2-5.4 3.2 1.4-6.1-4.8-4.2 6.3-.6 2.5-5.8Z"
              stroke="currentColor"
              strokeLinejoin="round"
            />
            <circle cx="20" cy="20" r="2.2" fill="currentColor" />
          </>
        )}
      </svg>
    </span>
  );
}

function PartnerItems() {
  return PARTNER_LANES.map((lane) => (
    <li key={lane.id} className="partner-carousel-item">
      <PartnerMark lane={lane} />
      <span>{lane.label}</span>
    </li>
  ));
}

export function LandingPartnerCarousel() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(preference.matches);

    preference.addEventListener("change", syncPreference);
    syncPreference();

    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  const isMoving = !reducedMotion && !interactionPaused;

  const resumeAfterFocus = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setInteractionPaused(false);
    }
  };

  return (
    <aside
      aria-labelledby="partner-carousel-title"
      className="partner-carousel"
      data-testid="partner-carousel"
      data-motion={reducedMotion ? "reduced" : isMoving ? "running" : "paused"}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={resumeAfterFocus}
    >
      <div className="partner-carousel-invitation">
        <p>Call for partnerships</p>
        <h2 id="partner-carousel-title">Partner with Subra</h2>
        <span>
          Help shape trusted infrastructure for accountable autonomous agents.
        </span>
        <a href="mailto:partner@subrahq.com">Work with us</a>
      </div>

      <div className="partner-carousel-showcase">
        <div className="partner-carousel-viewport">
          <div className="partner-carousel-track">
            <ul aria-label="Open partnership lanes">
              <PartnerItems />
            </ul>
            <ul aria-hidden="true">
              <PartnerItems />
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}
