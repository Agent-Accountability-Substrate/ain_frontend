"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

/**
 * Drives a figure's `render(t, root)` once a frame while it is on screen.
 *
 * `t` runs 0 → `duration` and wraps, so the figure is a pure function of its
 * position in the cycle. The loop needs no reset step: the modulo puts every
 * element back where it started because nothing was ever accumulated.
 *
 * Off screen the frame callback is simply not called, which is a real stop
 * rather than a paused animation still owned by the compositor.
 *
 * Under reduced motion the figure is rendered exactly once, at `still` — a
 * point late enough that everything has arrived and the reader gets the
 * finished state instead of a blank box.
 */
export function useFigureFrames<T extends HTMLElement>(
  duration: number,
  still: number,
  render: (t: number, root: T) => void,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);
  const renderRef = useRef(render);

  useEffect(() => {
    renderRef.current = render;
  });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      renderRef.current(still, root);
      return;
    }

    let elapsed = 0;
    let onScreen = false;

    // gsap's ticker rather than a private rAF loop: one clock for the page,
    // and it already throttles itself when the tab is hidden.
    const frame = (_time: number, delta: number) => {
      if (!onScreen) return;
      elapsed = (elapsed + delta / 1000) % duration;
      renderRef.current(elapsed, root);
    };

    gsap.ticker.add(frame);

    if (typeof IntersectionObserver === "undefined") {
      onScreen = true;
      return () => gsap.ticker.remove(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onScreen = entry.isIntersecting;
      },
      { threshold: 0.16 },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      gsap.ticker.remove(frame);
    };
  }, [duration, still]);

  return ref;
}
