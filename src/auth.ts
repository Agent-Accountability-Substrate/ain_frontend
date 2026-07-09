import "server-only";

import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";

/**
 * Generic OIDC integration via Auth.js (not a provider-specific SDK), so the
 * identity provider stays swappable at config level (see the ain_docs
 * DECISIONS.md 2026-07-03 auth entry). The Auth0 provider reads its
 * credentials from AUTH_AUTH0_ID / AUTH_AUTH0_SECRET / AUTH_AUTH0_ISSUER; the
 * session secret from AUTH_SECRET. `trustHost` is required behind the reverse
 * proxy; AUTH_URL (validated at boot in `@/lib/server-env`) pins the origin so
 * host headers are not trusted for URL/cookie derivation.
 */

/** Paths reachable without a session. Everything else is deny-by-default. */
function isPublicPath(pathname: string): boolean {
  // Auth.js's own routes must stay public or sign-in loops.
  if (pathname.startsWith("/api/auth")) return true;
  return pathname === "/";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // Short absolute lifetime + sliding refresh. JWT sessions have no server-side
  // revocation (no DB adapter yet), so bound the leaked-cookie window.
  session: { strategy: "jwt", maxAge: 60 * 60 * 8, updateAge: 60 * 30 },
  providers: [Auth0],
  callbacks: {
    authorized({ auth: session, request }) {
      // Deny by default: only explicitly public paths skip the session check.
      if (isPublicPath(request.nextUrl.pathname)) return true;
      return Boolean(session);
    },
  },
});
