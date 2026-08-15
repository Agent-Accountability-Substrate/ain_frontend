"use server";

import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";

export async function signInAction(): Promise<void> {
  await signIn("auth0", { redirectTo: "/onboarding/identity" });
}

export async function signOutAction(): Promise<void> {
  // Clear the local session, then hand off to Auth0's end-session endpoint so
  // the IdP SSO cookie is cleared too — otherwise "Sign in" silently
  // re-authenticates the previous user (a shared-terminal accountability risk).
  await signOut({ redirect: false });
  const issuer = process.env.AUTH_AUTH0_ISSUER;
  const clientId = process.env.AUTH_AUTH0_ID;
  const returnTo = process.env.AUTH_URL ?? "http://localhost:3000";
  redirect(
    `${issuer}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo)}`,
  );
}
