"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function CompatibilityEntry({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const reducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const enter = () => {
      section.dataset.entry = "entered";
    };

    if (
      reducedMotion?.matches ||
      typeof window.IntersectionObserver !== "function"
    ) {
      enter();
      return;
    }

    section.dataset.entry = "pending";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          enter();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12%", threshold: 0.16 },
    );

    const syncMotionPreference = () => {
      if (reducedMotion?.matches) {
        enter();
        observer.disconnect();
      }
    };

    observer.observe(section);
    reducedMotion?.addEventListener("change", syncMotionPreference);

    return () => {
      observer.disconnect();
      reducedMotion?.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="compatibility"
      data-entry="static"
      className="compatibility-section relative scroll-mt-24 overflow-hidden bg-site-paper py-[clamp(72px,9vw,126px)]"
    >
      {children}
    </section>
  );
}
