import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";

/**
 * The vanity auth routes, forwarded to Auth0's Universal Login.
 *
 * `/signin`, `/login`, `/signup` and `/register` are the four addresses people
 * type or paste into a wiki, so all four answer rather than 404. None of them
 * renders anything: the hand-made screens in `domains/auth/` are not served
 * yet, and until they are, the identity provider owns this step.
 *
 * The URL is built by Auth.js rather than assembled here, which is the whole
 * point of going through `signIn` — the authorize URL carries the audience,
 * the state and the PKCE challenge, and a hand-written redirect would drop all
 * three and fail at the callback in a way that looks like a broken login.
 *
 * ## Why a browser's own fetch is turned away
 *
 * Starting a flow is not a read. `signIn` writes the PKCE code verifier to a
 * cookie, and there is one of that cookie per browser, not one per tab: every
 * hit on any of these four addresses replaces whatever verifier was already in
 * flight. A login waiting on the Auth0 form when that happens comes back to
 * the callback holding a code minted against the verifier it no longer has,
 * Auth0 answers `invalid_grant`, and the visitor is shown an auth error for
 * something they did in a different tab.
 *
 * A person choosing to sign in twice is at least a person choosing. A browser
 * that fetched one of these addresses on its own — a prerender from
 * speculation rules, Chrome's "preload pages" setting — is not, and it can
 * destroy a flow the visitor is in the middle of without them ever seeing this
 * route. Those requests announce themselves, so they are answered with nothing
 * and no flow is started; the click that follows starts one. `no-store` is
 * what makes that safe rather than a way of breaking sign-in outright: a
 * prefetched response that could be stored would be reused for the real
 * navigation, and the visitor would click Sign in and get the empty answer
 * meant for the browser.
 *
 * The App Router's own prefetch needs nothing here. These are route handlers,
 * so `next/link` cannot soft-navigate to one: an RSC-flagged request is
 * answered by Next itself with a redirect, and this function never runs.
 *
 * This narrows the window rather than closing it. Two tabs where someone
 * deliberately signs in on both still collide, which is inherent to a
 * cookie-held verifier and wants recovery at the callback, not another guard
 * here.
 */

/** Where Auth0 sends a caller back to once they are authenticated. */
const AFTER_AUTH = "/onboarding/identity";

type AuthIntent = "login" | "signup";

/**
 * Whether the browser asked for this itself, rather than because someone chose
 * to sign in.
 *
 * `Sec-Purpose` is the current signal; `Purpose` and `X-Moz` are the same one
 * from browsers that predate it. Absent all three, this is treated as a
 * person — a guard that turned away anything it could not positively identify
 * would turn away every visitor behind a proxy that strips headers, and the
 * cost of guessing wrong in that direction is someone who cannot sign in at
 * all.
 *
 * Matched as whole tokens rather than as substrings, for the same reason:
 * `Sec-Purpose` is a list — `prefetch`, or `prefetch;prerender` — and a
 * substring test would read any header value that merely contains the word as
 * a browser announcing itself.
 */
function isSpeculative(requested: Headers): boolean {
  const announced = [
    requested.get("sec-purpose"),
    requested.get("purpose"),
    requested.get("x-moz"),
  ]
    .join(";")
    .toLowerCase()
    .split(/[;,\s]+/);

  return announced.includes("prefetch") || announced.includes("prerender");
}

export async function startAuth(intent: AuthIntent): Promise<Response> {
  if (isSpeculative(await headers())) {
    return new Response(null, {
      status: 204,
      // Not storable, so the navigation this was speculating about goes to the
      // network and gets a real flow rather than replaying this.
      headers: { "cache-control": "no-store" },
    });
  }

  const url: string = await signIn(
    "auth0",
    { redirect: false, redirectTo: AFTER_AUTH },
    // Auth0's own parameter for opening Universal Login on its sign-up tab.
    // Nothing is passed for a login, so the default screen is used.
    intent === "signup" ? { screen_hint: "signup" } : undefined,
  );
  redirect(url);
}
