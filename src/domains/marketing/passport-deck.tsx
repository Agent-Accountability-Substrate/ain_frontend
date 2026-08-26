"use client";

import { useState, type PointerEvent } from "react";

import {
  PASSPORT_VERSIONS,
  type PassportVersion,
} from "@/domains/marketing/landing-content";
import { CardOrbit, FingerprintGlyph } from "@/lib/brand/registry-glyphs";
import { cn } from "@/lib/utils";

function PassportFront({
  version,
  hidden,
}: {
  version: PassportVersion;
  hidden: boolean;
}) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="absolute inset-0 flex flex-col px-[22px] pt-5 pb-[18px] [backface-visibility:hidden] [transform:rotateY(0deg)]"
    >
      <span className="pass-skin" aria-hidden="true">
        <span className="pass-tex" />
        <span className="pass-bio" />
        <CardOrbit />
        <span className="pass-scan" />
        <span className="pass-light" />
      </span>

      <div className="flex items-center justify-between gap-3 font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim select-none">
        <span className="pass-shift-tl inline-flex items-center gap-2">
          <span
            className={cn(
              "inline-flex text-[var(--pa)]",
              version.inForce &&
                "drop-shadow-[0_0_5px_color-mix(in_srgb,var(--pa)_60%,transparent)]",
            )}
          >
            <FingerprintGlyph />
          </span>
          AIN Registry
        </span>
        <span className="pass-shift-tr text-[var(--pa)]">
          {version.id} · {version.event}
        </span>
      </div>

      <div className="mt-auto text-[17px] leading-[1.3] font-medium tracking-[-0.022em] text-site-cream">
        {version.name}
      </div>

      <div className="mt-[18px]">
        <span className="block font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim">
          Accountable
        </span>
        <span
          className={cn(
            "mt-1.5 block text-[15px] font-medium tracking-[-0.02em]",
            version.inForce ? "text-[var(--pa)]" : "text-site-cream-soft",
          )}
        >
          {version.accountable}
        </span>
      </div>

      <div className="mt-[18px]">
        <span className="block font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-cream-dim">
          Scope
        </span>
        <span className="mt-1.5 block font-site-mono text-[11.5px] leading-[1.8] text-site-cream-soft">
          {version.scope.map((entry) => (
            <span key={entry} className="block">
              {entry}
            </span>
          ))}
        </span>
      </div>

      <div className="mt-5 flex justify-between gap-3 border-t border-site-cream/[0.09] pt-[18px] font-site-mono text-[10.5px] text-site-cream-dim">
        <span className="pass-shift-bl">{version.ain}</span>
        <span className="pass-shift-br">{version.issuedOn}</span>
      </div>
    </div>
  );
}

function PassportBack({
  version,
  hidden,
}: {
  version: PassportVersion;
  hidden: boolean;
}) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="absolute inset-0 flex flex-col px-[22px] pt-5 pb-[18px] text-site-ink [backface-visibility:hidden] [transform:rotateY(180deg)]"
    >
      <span className="pass-skin pass-skin-back" aria-hidden="true" />
      <div className="pass-shift-t border-b border-site-rule pb-3.5 font-site-mono text-[9.5px] uppercase tracking-[0.14em] text-site-muted">
        Registered agent record
      </div>
      <dl className="m-0 p-0">
        {version.record.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-3.5 border-b border-site-ink/[0.08] py-[9px]"
          >
            <dt className="font-site-mono text-[9px] whitespace-nowrap uppercase tracking-[0.13em] text-site-muted">
              {row.label}
            </dt>
            <dd
              className={cn(
                "m-0 text-right font-site-mono text-[11px] break-all",
                row.tone === "verified" && "text-[#2e9e70]",
                row.tone === "in-force" && "text-site-accent",
                row.tone === undefined && "text-site-ink-soft",
              )}
            >
              {Array.isArray(row.value)
                ? row.value.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))
                : row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Three versions of one agent, dealt as a hand of cards.
 *
 * Clicking a card behind brings it forward; clicking the one in front turns it
 * over. The two behind pivot about a point near their own foot rather than
 * sliding, so they splay the way a hand of cards does. Every animation is the
 * CSS's — this only moves `data-position` and `data-flipped` between states,
 * which is also what makes the whole thing legible to a screen reader through
 * one button per card.
 *
 * Both faces of every card are mounted, because the flip is a CSS transform on
 * a mounted subtree. `backface-visibility` hides the turned-away face's pixels
 * and nothing else, so the face that is not showing is marked `aria-hidden` —
 * otherwise a reader is read all three fronts and all three nine-row records
 * in sequence, and the button offering to turn a card over changes nothing it
 * can perceive.
 */
export function PassportDeck() {
  const [activeIndex, setActiveIndex] = useState(PASSPORT_VERSIONS.length - 1);
  const [flipped, setFlipped] = useState(false);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty(
      "--glow-x",
      `${(((event.clientX - bounds.left) / bounds.width) * 100).toFixed(1)}%`,
    );
    card.style.setProperty(
      "--glow-y",
      `${(((event.clientY - bounds.top) / bounds.height) * 100).toFixed(1)}%`,
    );
  };

  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--glow-x", "50%");
    event.currentTarget.style.setProperty("--glow-y", "34%");
  };

  return (
    <>
      <div className="relative isolate mt-[52px] min-h-[34rem] [--deck-drop:1.5rem] [--deck-offset:clamp(3.4rem,11vw,6.5rem)] [--deck-peek:0.875rem] [perspective:1400px] [transform-style:preserve-3d] max-[700px]:[--deck-drop:1.1rem] max-[700px]:[--deck-offset:2.5rem] after:pointer-events-none after:absolute after:bottom-[1.2rem] after:left-1/2 after:z-0 after:h-[3.6rem] after:w-[min(30rem,84%)] after:-translate-x-1/2 after:rounded-[50%] after:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.44),rgba(0,0,0,0.22)_42%,transparent_74%)] after:content-['']">
        {PASSPORT_VERSIONS.map((version, index) => {
          const relative =
            (index - activeIndex + PASSPORT_VERSIONS.length) %
            PASSPORT_VERSIONS.length;
          const position =
            relative === 0 ? "active" : relative === 1 ? "next" : "previous";
          const isActive = position === "active";
          const showsBack = isActive && flipped;

          return (
            <article
              key={version.id}
              data-position={position}
              data-flipped={showsBack}
              data-live={version.inForce}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              className={cn(
                "pass absolute m-auto aspect-[384/496] w-[min(22rem,calc(100%-2.5rem))] [perspective:1400px]",
                isActive && "inset-0 z-30",
                position === "next" &&
                  "top-[calc(var(--deck-drop)*2)] right-[calc(0px-var(--deck-offset)*2)] bottom-0 left-0 z-20 rotate-[8deg]",
                position === "previous" &&
                  "top-[calc(var(--deck-drop)*2)] right-0 bottom-0 left-[calc(0px-var(--deck-offset)*2)] z-10 rotate-[-8deg]",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 transition-transform duration-[var(--pass-dur)] ease-[var(--pass-ease)] [transform-style:preserve-3d]",
                  showsBack && "[transform:rotateY(180deg)]",
                )}
              >
                <PassportFront version={version} hidden={showsBack} />
                <PassportBack version={version} hidden={!showsBack} />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isActive) {
                    setFlipped((wasFlipped) => !wasFlipped);
                    return;
                  }
                  setActiveIndex(index);
                  setFlipped(false);
                }}
                aria-label={
                  isActive
                    ? `Turn over ${version.id} to see the full registered agent record`
                    : `Bring ${version.id} to the front`
                }
                className="absolute z-[2] inset-[calc(-1*var(--pass-grow-y))_calc(-1*var(--pass-grow-x))] cursor-pointer rounded-[var(--pass-r)] border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--pa)]"
              />
            </article>
          );
        })}
      </div>
      <p className="relative z-[1] mt-[30px] font-site-mono text-[11.5px] tracking-[0.02em] text-site-cream-dim select-none">
        Click a card to bring it forward · click it again to turn it over
      </p>
    </>
  );
}
