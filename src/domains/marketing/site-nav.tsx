"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SiteWordmark } from "@/lib/brand/site-mark";
import { cn } from "@/lib/utils";

const HEADER_LINKS = [
  { label: "Product", href: "#top" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Integrity", href: "#integrity" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Security", href: "#security" },
] as const;

const MOBILE_LINKS = HEADER_LINKS.map((link) =>
  link.href === "#how-it-works" ? { ...link, label: "Evidence flow" } : link,
);

/**
 * The navigation bar, and the panel it becomes on a narrow viewport.
 *
 * Open, the bar and the panel are one fixed column: the bar keeps its own
 * height and the panel takes what is left. That holds the burger still between
 * the two states without measuring anything—the panel starts where the bar
 * ends because it is simply the next box down.
 *
 * Scroll is locked on both `html` and `body`: locking only `body` still lets
 * iOS Safari scroll the document behind an overlay. Every control in the panel
 * closes it on the way out, sign-in included: `/signin` is a route handler, so
 * the navigation is a full page load, and a panel left up over it holds the
 * scroll lock and the focus for the whole round trip — and stays there if the
 * load fails.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  /** Closes from inside the panel, which is about to stop being focusable. */
  const closeFromPanel = () => {
    setOpen(false);
    burgerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    const { documentElement, body } = document;
    const previous = {
      root: documentElement.style.overflow,
      body: body.style.overflow,
    };
    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFromPanel();
    };
    // A rotation to landscape can cross the breakpoint with the panel still up.
    const onResize = () => {
      if (window.innerWidth > 1000) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      documentElement.style.overflow = previous.root;
      body.style.overflow = previous.body;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <div className={cn(open && "fixed inset-0 z-[200] flex flex-col")}>
      <div className={cn(open && "bg-site-paper")}>
        <nav className="mx-auto flex max-w-[1320px] items-center justify-between px-[clamp(20px,3.05vw,44px)] py-[22px] max-[700px]:py-4">
          <a href="#top" aria-label="Subra home" className="text-site-ink">
            <SiteWordmark showProduct={false} />
          </a>

          <div
            aria-label="Primary"
            className="flex gap-[clamp(14px,2vw,32px)] text-[14px] text-site-ink-soft max-[1000px]:hidden"
          >
            {HEADER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-site-ink"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 max-[1000px]:hidden">
            <a
              href="/signin"
              className="rounded-full px-4 py-2.5 text-[13.5px] font-medium text-site-ink-soft hover:bg-site-ink/5 hover:text-site-ink"
            >
              Sign in
            </a>
            <a
              href="#request"
              className="rounded-full bg-site-ink px-5 py-2.5 text-[13.5px] font-medium text-site-paper"
            >
              Book a private demo
            </a>
          </div>

          <button
            ref={burgerRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            onClick={() => {
              setOpen((wasOpen) => !wasOpen);
            }}
            className="relative -mr-2 hidden h-10 w-10 flex-none cursor-pointer rounded-[9px] text-site-ink hover:bg-site-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-accent max-[1000px]:inline-flex"
          >
            <span
              className={cn(
                "absolute left-[11px] h-[1.5px] w-[18px] rounded-[2px] bg-current transition-[top,rotate] duration-[180ms] ease-[ease]",
                open ? "top-[19.5px] rotate-45" : "top-[17px]",
              )}
            />
            <span
              className={cn(
                "absolute left-[11px] h-[1.5px] w-[18px] rounded-[2px] bg-current transition-[top,rotate] duration-[180ms] ease-[ease]",
                open ? "top-[19.5px] -rotate-45" : "top-[22.5px]",
              )}
            />
          </button>
        </nav>
      </div>

      {/* The scroll box is this element and the padding is on the one inside
          it, so the foot of the list clears the home indicator instead of
          being cropped by the scroller. */}
      <div
        id="site-mobile-menu"
        hidden={!open}
        className="animate-site-menu-in min-h-0 flex-1 overflow-y-auto overscroll-contain bg-site-paper"
      >
        <div className="mx-auto flex min-h-full max-w-[1320px] flex-col px-[clamp(20px,3.05vw,44px)] pt-2.5 pb-[calc(26px+env(safe-area-inset-bottom,0px))]">
          <nav aria-label="Main" className="flex flex-col">
            {MOBILE_LINKS.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeFromPanel}
                className={cn(
                  "flex items-center justify-between gap-[18px] border-b border-dashed border-site-rule px-0.5 py-[21px] text-[21px] tracking-[-0.022em] text-site-ink",
                  index === 0 && "border-t",
                )}
              >
                {link.label}
                <ChevronRight
                  className="h-[15px] w-[15px] flex-none text-site-muted"
                  aria-hidden="true"
                />
              </a>
            ))}
          </nav>

          <div className="mt-auto grid grid-cols-2 gap-[11px] pt-9">
            <a
              href="/signin"
              onClick={closeFromPanel}
              className="inline-flex items-center justify-center rounded-full border border-site-rule px-4 py-[15px] text-[14.5px] font-medium text-site-ink transition-colors duration-300 ease-site hover:border-site-ink"
            >
              Sign in
            </a>
            <a
              href="#request"
              onClick={closeFromPanel}
              className="inline-flex items-center justify-center rounded-full bg-site-ink px-4 py-[15px] text-[14.5px] font-medium text-site-paper transition-colors duration-300 ease-site hover:bg-[#2c2e34]"
            >
              Book a private demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
