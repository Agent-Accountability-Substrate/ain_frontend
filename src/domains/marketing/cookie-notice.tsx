"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { isPublicPath } from "@/domains/auth/public-paths";

/**
 * A notice, not a consent gate: the site sets no optional cookies, and PECR
 * exempts strictly necessary ones from consent while still expecting the
 * visitor to be told. If an analytics tag is ever added this is the wrong
 * shape and should be replaced by real consent, not extended.
 *
 * Dismissal lives in `localStorage` rather than a cookie — it is a per-visitor
 * UI preference, not application state, and a cookie would be sent on every
 * request to be read once in the browser.
 */

/** Bumped only if the notice's substance changes and should be shown again. */
const STORAGE_KEY = "subra.cookie-notice.v1";

const listeners = new Set<() => void>();

/**
 * Dismissal for this page view, when the browser will not keep it. Without it,
 * a visitor whose storage is blocked clicks "Got it" and the notice stays put,
 * because the snapshot is read back out of the storage that refused the write.
 */
let dismissedThisView = false;

function getSnapshot(): boolean {
  if (dismissedThisView) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dismissed";
  } catch {
    // Private mode or blocked site data. Showing the notice twice is a smaller
    // failure than the page not rendering.
    return false;
  }
}

/**
 * Prerendered HTML is shared by everyone, including whoever dismissed this
 * months ago, so it must not contain the notice. The client snapshot puts it
 * back for whoever has not.
 */
function getServerSnapshot(): boolean {
  return true;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function dismiss() {
  dismissedThisView = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "dismissed");
  } catch {
    // Nothing to do. It reappears next visit, which is the safe direction.
  }
  for (const notify of listeners) notify();
}

/** The in-view flag outlives a single render by design, so tests need a way to clear. */
export function resetCookieNotice(): void {
  dismissedThisView = false;
}

export function CookieNotice() {
  const dismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const pathname = usePathname();

  // The public site only, read off the same predicate as the session gate. The
  // bar is fixed at `z-50` over a shell that is `overflow: hidden` and ends in
  // its own footer row, so on `/onboarding/identity` — the first screen after
  // any sign-in, reached with empty storage by definition — it would cover the
  // one control that leads out of the page, with nothing to scroll.
  if (!isPublicPath(pathname)) return null;

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-site-hair bg-site-ink/95 px-[clamp(16px,4vw,40px)] py-4 text-site-cream backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <p className="max-w-[74ch] text-[13.5px] leading-[1.6] text-site-cream-soft">
          We use only the cookies this site needs to work, including the ones
          that keep a sign-in secure. No analytics or advertising cookies.{" "}
          <Link
            href="/cookies"
            className="text-site-cream underline decoration-site-cream/40 underline-offset-[4px] transition-colors duration-200 hover:text-site-accent"
          >
            Read the cookie policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-site-cream px-6 py-2.5 text-[14px] font-medium tracking-[-0.012em] text-site-ink transition-colors duration-300 hover:bg-[#dfdbd2]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
