"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The dark stage the hero and the record band share.
 *
 * It starts as an inset card and opens to full bleed as it scrolls past, which
 * is a single custom property — `--expand`, 0 to 1 — that the CSS turns into
 * both the horizontal inset and the corner radius. Driving one number from
 * JavaScript and letting CSS derive the rest keeps the scroll handler to an
 * assignment, and it is rAF-throttled so a fast wheel cannot queue more
 * repaints than the compositor will draw.
 *
 * It is motion driven by an interaction, so anyone who has asked for less of it
 * gets none: the handler is not attached at all, and the stage holds at the
 * inset card the CSS starts it on — the same thing a visitor whose JavaScript
 * never arrives sees, rather than a third state invented for the occasion.
 */
export function SiteStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (stage === null) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ticking = false;

    const update = () => {
      ticking = false;
      const end = stage.offsetTop + stage.offsetHeight - window.innerHeight;
      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / Math.max(1, end)),
      );
      stage.style.setProperty("--expand", progress.toFixed(4));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };

    // Re-read on change rather than once on mount: the setting can be turned on
    // with the page already open, and what is left behind then is whatever
    // `--expand` the last scroll happened to write.
    const apply = () => {
      detach();
      if (reduced.matches) {
        stage.style.removeProperty("--expand");
        return;
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", update);
      update();
    };

    apply();
    reduced.addEventListener("change", apply);

    return () => {
      reduced.removeEventListener("change", apply);
      detach();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-testid="site-stage"
      className="site-stage site-dots site-stage-glow bg-[#0b1127] text-site-cream"
    >
      {children}
    </div>
  );
}
