"use client";

import { useEffect, useState } from "react";
import { SignInButton } from "./sign-in-button";
import { SubraLogo } from "./subra-logo";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Feature", href: "#feature" },
  { label: "Story", href: "#story" },
  { label: "Download", href: "#download" },
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

  return (
    <header
      className={`sticky left-0 right-0 z-50 px-4 transition-all duration-300 ease-out ${scrolled ? "top-0" : "top-4"}`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between overflow-hidden rounded-full px-5 transition-all duration-300 ${
          scrolled
            ? "border border-[#E4E6ED] bg-white/85 shadow-[0_24px_50px_-30px_rgba(9,17,38,0.18)] backdrop-blur-xl py-2"
            : "bg-transparent py-2"
        }`}
      >
        <a
          href="#home"
          aria-label="SUBRA AIN Registry home"
          className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition hover:bg-[#EDF0F7]"
        >
          <SubraLogo preload className="w-28 sm:w-32" />
          <span className="hidden border-l border-[#D8DDE8] pl-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#526078] xl:inline">
            AIN Registry
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-3 text-sm font-medium text-[#091126]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-2.5 py-1.5 transition hover:bg-[#EDF0F7] hover:text-[var(--secondary)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <SignInButton className="px-4 py-2 text-sm" />
            <a
              href="#download"
              className="inline-flex items-center justify-center rounded-[12px] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Download
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E6ED] text-[#091126] shadow-sm shadow-[#091126]/5 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className="sr-only">Toggle navigation menu</span>
          <div className="space-y-1">
            <span className="block h-0.5 w-6 rounded-full bg-[#091126]"></span>
            <span className="block h-0.5 w-6 rounded-full bg-[#091126]"></span>
            <span className="block h-0.5 w-6 rounded-full bg-[#091126]"></span>
          </div>
        </button>
      </div>

      {menuOpen ? (
        <div className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-[22px] border border-[#E4E6ED] bg-white/95 px-4 py-3 shadow-[0_24px_50px_-30px_rgba(9,17,38,0.18)] md:hidden">
          <nav className="flex flex-col gap-2 text-sm font-medium text-[#091126]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-[14px] px-4 py-2 transition hover:bg-[#EDF0F7]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <SignInButton className="w-full px-4 py-2 text-sm" />
            <a
              href="#download"
              className="inline-flex items-center justify-center rounded-[12px] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Download
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
