"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll reveal, applied after mount rather than rendered into the markup.
 *
 * The hiding class is added by this effect, never by the server — so a visitor
 * whose JavaScript never arrives, and every assertion in the test suite, sees
 * the content rather than an element the CSS has set to `opacity: 0` with
 * nothing left to un-hide it. Reduced motion and browsers without
 * `IntersectionObserver` take the same path: no class, nothing to reveal.
 */
function useReveal(className: string, stagger = 0) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (root === null) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const parts =
      stagger > 0
        ? Array.from(root.querySelectorAll<HTMLElement>("[data-reveal-part]"))
        : [root];
    parts.forEach((part) => part.classList.add(className));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          parts.forEach((part, index) => {
            part.style.transitionDelay = `${index * stagger}ms`;
            part.classList.add("is-in");
          });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [className, stagger]);

  return ref;
}

/** A whole object arriving at once — a card, a table row, a form. */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "tr" | "li";
}) {
  const ref = useReveal("site-reveal-block");
  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

/**
 * A heading that resolves a word at a time.
 *
 * The words are split here rather than by walking text nodes after mount, so
 * the server renders the finished heading and the accent stays a real element
 * instead of something reconstructed from a string.
 */
export function RevealHeading({
  lead,
  accent,
  className,
  level = 2,
}: {
  lead: string;
  accent?: string;
  className?: string;
  level?: 1 | 2;
}) {
  const ref = useReveal("site-reveal-word", 42);
  const Tag = level === 1 ? "h1" : "h2";

  const words = [
    ...lead.split(" ").map((word) => ({ word, accented: false })),
    ...(accent ?? "")
      .split(" ")
      .filter(Boolean)
      .map((word) => ({ word, accented: true })),
  ];

  return (
    <Tag ref={ref as never} className={cn("text-balance", className)}>
      {words.map(({ word, accented }, index) => (
        <span key={`${word}-${String(index)}`}>
          {index > 0 ? " " : null}
          <span
            data-reveal-part
            className={cn("inline-block", accented && "text-site-accent")}
          >
            {word}
          </span>
        </span>
      ))}
    </Tag>
  );
}
