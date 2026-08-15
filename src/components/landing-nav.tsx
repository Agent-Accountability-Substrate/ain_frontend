"use client";

import { useEffect, useState } from "react";
import { SignInButton } from "./sign-in-button";
import { SubraLogo } from "./subra-logo";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Integrity", href: "#integrity" },
];

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className={`sticky left-0 right-0 z-50 px-4 transition-all duration-300 ease-out sm:px-6 lg:px-8 ${
        scrolled ? "top-2" : "top-4"
      }`}
    >
      <div
        className={`mx-auto flex max-w-content items-center justify-between rounded-full py-2 pl-2 pr-4 transition-all duration-300 ${
          scrolled
            ? // A 1px #E4E6ED edge plus a 50px shadow drew a box around the
              // bar. A 7% hairline over a blurred ground reads as chrome
              // lifting off the page, which is the whole point of the pill.
              "border border-line-hair bg-white/80 shadow-[0_1px_2px_rgba(9,17,38,0.04),0_12px_32px_-20px_rgba(9,17,38,0.22)] backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        {/* Links cluster with the lockup instead of orbiting the far side:
            with two links, justify-between left ~700px of dead pill. */}
        <div className="flex min-w-0 items-center">
          <a
            href="#home"
            aria-label="Subra AIN Registry home"
            className="flex items-center gap-3 rounded-sm px-2 py-2 transition hover:bg-line-soft"
          >
            <SubraLogo preload className="w-28 sm:w-32" />
            <span className="hidden border-l border-line-strong pl-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted xl:inline">
              AIN Registry
            </span>
          </a>

          <nav className="ml-6 hidden items-center gap-1 text-sm font-medium text-ink md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-sm px-2.5 py-1.5 transition hover:bg-line-soft hover:text-secondary"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <SignInButton className="bg-transparent px-3 py-2 text-sm text-ink shadow-none hover:bg-line-soft" />
          <a
            href="#talk"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
          >
            Request access
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-hair bg-white/70 text-ink md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="landing-nav-menu"
        >
          <span className="sr-only">Toggle navigation menu</span>
          <div className="space-y-1">
            <span className="block h-0.5 w-6 rounded-full bg-ink"></span>
            <span className="block h-0.5 w-6 rounded-full bg-ink"></span>
            <span className="block h-0.5 w-6 rounded-full bg-ink"></span>
          </div>
        </button>
      </div>

      {/* Absolute, not in flow. As a sibling in the sticky header's box this
          panel added its own height to the header and pushed <main> down 218px
          on open — the page moved underneath the reader's thumb. */}
      {menuOpen ? (
        <div
          id="landing-nav-menu"
          className="absolute inset-x-0 top-full px-4 sm:px-6 md:hidden lg:px-8"
        >
          <div className="mx-auto mt-2 max-w-content rounded-lg border border-line-hair bg-white/95 p-2 shadow-[0_1px_2px_rgba(9,17,38,0.04),0_24px_48px_-24px_rgba(9,17,38,0.28)] backdrop-blur-xl">
            <nav className="flex flex-col gap-1 text-sm font-medium text-ink">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-sm px-4 py-2.5 transition hover:bg-line-soft"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-2 flex flex-col gap-2 border-t border-line-hair pt-2">
              <SignInButton className="w-full bg-transparent px-3 py-2 text-sm text-ink shadow-none hover:bg-line-soft" />
              <a
                href="#talk"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Request access
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
