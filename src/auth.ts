import "server-only";

import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";

/**
 * Generic OIDC integration via Auth.js (not a provider-specific SDK), so the
 * identity provider stays swappable at config level (see the ain_docs
 * DECISIONS.md 2026-07-03 auth entry). The Auth0 provider reads its
 * credentials from the AUTH_AUTH0_ID / AUTH_AUTH0_SECRET / AUTH_AUTH0_ISSUER
 * environment variables; the session secret from AUTH_SECRET.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [Auth0],
  callbacks: {
    authorized({ auth: session, request }) {
      const onDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      return onDashboard ? Boolean(session) : true;
    },
  },
});
