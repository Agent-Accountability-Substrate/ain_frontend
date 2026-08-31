"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

/**
 * The cookie notice.
 *
 * A notice, not a consent gate, because there is nothing here to consent to:
 * the public pages set no analytics, advertising or personalisation cookies,
 * and the only cookies the site writes are the strictly necessary ones the
 * sign-in flow needs. UK PECR and the ePrivacy Directive exempt those from
 * consent while still expecting the visitor to be told, so this informs and
 * gets out of the way. The day an analytics tag is added, this component is
 * the wrong shape and should be replaced by real consent, not extended.
 *
 * Cross-cutting rather than a marketing component: it is mounted once in the
 * root layout so a public page added later cannot forget it, and `marketing/`
 * is a leaf that the authenticated shell cannot import from.
 */

/** Bumped only if the notice's substance changes and should be shown again. */
const STORAGE_KEY = "subra.cookie-notice.v1";

/**
 * Dismissal is remembered in `localStorage` rather than a cookie: a cookie
 * would be sent on every request to be read once in the browser, and writing
 * one to say we barely use cookies invites the obvious question. It is a
 * per-visitor UI preference, not application state, which is what the
 * no-browser-storage rule is about.
 *
 * Read through `useSyncExternalStore` rather than an effect that calls
 * `setState`, which is what React reads browser state with and what the
 * compiler's rules require. A boolean is compared by identity, so reading
 * storage on each call is stable and needs no cache to keep React still.
 */
const listeners = new Set<() => void>();

/**
 * Dismissal for this page view, when the browser will not keep it.
 *
 * Without it, a visitor whose storage is blocked clicks "Got it" and the
 * notice stays exactly where it was, because the snapshot is read straight
 * back out of the storage that just refused the write.
 */
let dismissedThisView = false;

function getSnapshot(): boolean {
  if (dismissedThisView) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dismissed";
  } catch {
    // Private mode, blocked site data, a browser that throws on access. The
    // notice showing twice is a smaller failure than the page not rendering.
    return false;
  }
}

/**
 * Dismissed, as far as the server is concerned.
 *
 * The prerendered HTML is shared by everyone, including the visitor who
 * dismissed this months ago, so it must not contain the notice. The client
 * snapshot puts it back for whoever has not.
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
