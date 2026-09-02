import "server-only";

import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";

import { isPublicPath } from "@/domains/auth/public-paths";

/**
 * Generic OIDC integration via Auth.js (not a provider-specific SDK), so the
 * identity provider stays swappable at config level (see the ain_docs
 * DECISIONS.md 2026-07-03 auth entry). The Auth0 provider reads its
 * credentials from AUTH_AUTH0_ID / AUTH_AUTH0_SECRET / AUTH_AUTH0_ISSUER; the
 * session secret from AUTH_SECRET. `trustHost` is required behind the reverse
 * proxy; AUTH_URL (validated at boot in `@/lib/config/server-env`) pins the origin so
 * host headers are not trusted for URL/cookie derivation.
 *
 * ## The API access token
 *
 * `ain_backend_api` verifies an **access token** whose `aud` is the registered
 * Auth0 API, and Auth0 only puts the namespaced claims that API needs on a
 * token issued for that audience. Requesting it is therefore not optional: a
 * default login yields a session that cannot call the backend at all.
 *
 * The token is carried in the JWT and copied onto the session so server code
 * can forward it. **That is safe only while the session never reaches the
 * browser.** This app has no `SessionProvider` and no `useSession` — every
 * page reads it through `auth()` in a server component — and
 * `auth.session-exposure.test.ts` fails if that stops being true, because
 * introducing either would ship a bearer token for the registry API into
 * client-side JavaScript.
 *
 * No refresh rotation, deliberately. The session's absolute lifetime is 8h and
 * Auth0's default access-token lifetime is 24h, so the token outlives the
 * session it rides in and a refresh would never fire. If the API's token
 * lifetime is ever configured below 8h that stops being true, so
 * `accessToken()` treats an expired token as absent and forces re-auth rather
 * than sending a stale bearer and reading the 401 as a permissions problem.
 */

declare module "next-auth" {
  interface Session {
    /** Bearer for `ain_backend_api`. Server-only — see the module docstring. */
    accessToken?: string;
  }
}

/**
 * The JWT is not augmented, deliberately. `@auth/core` is not hoisted under
 * pnpm's strict layout, so `declare module "@auth/core/jwt"` cannot resolve —
 * and `JWT extends Record<string, unknown>` already permits these keys. Reading
 * them back through a narrowing check is the better shape regardless: the token
 * is decoded from a cookie, so proving the type is honest work, not ceremony.
 */
const ACCESS_TOKEN = "accessToken";
const EXPIRES_AT = "accessTokenExpiresAt";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // Short absolute lifetime + sliding refresh. JWT sessions have no server-side
  // revocation (no DB adapter yet), so bound the leaked-cookie window.
  session: { strategy: "jwt", maxAge: 60 * 60 * 8, updateAge: 60 * 30 },
  providers: [
    Auth0({
      authorization: {
        params: {
          // Without an audience Auth0 issues an opaque userinfo token and puts
          // none of the API's namespaced claims on it, so the backend refuses
          // every call. Read here rather than from `@/lib/config/server-env` because
          // the provider is constructed at module load, before boot validation
          // runs; server-env re-validates the same variable and fails closed.
          audience: process.env["AUTH_AUTH0_AUDIENCE"],
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      // Deny by default: only explicitly public paths skip the session check.
      if (isPublicPath(request.nextUrl.pathname)) return true;
      return Boolean(session);
    },
    jwt({ token, account }) {
      // `account` is present only on the sign-in pass; every later call just
      // carries the token forward. Overwriting unconditionally would blank the
      // access token on the first session refresh.
      if (account) {
        token[ACCESS_TOKEN] = account.access_token;
        token[EXPIRES_AT] = account.expires_at;
      }
      return token;
    },
    session({ session, token }) {
      // Expired is treated as absent, so a stale bearer is never sent: the
      // backend would answer 401 and the UI would read a clock problem as a
      // permissions problem. `expires_at` is the issuer's own value, not a
      // local clock reading, so only our own clock skew is in play.
      const accessToken = token[ACCESS_TOKEN];
      const expiresAt = token[EXPIRES_AT];
      const expired =
        typeof expiresAt === "number" && expiresAt * 1000 <= Date.now();
      if (typeof accessToken === "string" && !expired) {
        session.accessToken = accessToken;
      }
      return session;
    },
  },
});
