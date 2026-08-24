import "server-only";

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
 */

/** Where Auth0 sends a caller back to once they are authenticated. */
const AFTER_AUTH = "/onboarding/identity";

type AuthIntent = "login" | "signup";

export async function startAuth(intent: AuthIntent): Promise<never> {
  const url: string = await signIn(
    "auth0",
    { redirect: false, redirectTo: AFTER_AUTH },
    // Auth0's own parameter for opening Universal Login on its sign-up tab.
    // Nothing is passed for a login, so the default screen is used.
    intent === "signup" ? { screen_hint: "signup" } : undefined,
  );
  redirect(url);
}
