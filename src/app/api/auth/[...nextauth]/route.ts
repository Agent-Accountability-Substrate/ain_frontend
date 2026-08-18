import { handlers } from "@/auth";

/**
 * Auth.js's own endpoints, with one deliberately removed — on both verbs.
 *
 * `/api/auth/session` serialises the session to JSON for anything holding the
 * cookie, including ordinary client-side JavaScript. Since the session carries
 * the bearer token for `ain_backend_api`, leaving that route reachable hands a
 * registry API credential to any script on the page. Verified, not theorised:
 * `fetch('/api/auth/session')` from the page context returned the access token
 * in full.
 *
 * POST is the same endpoint, not a different one. It backs Auth.js's session
 * `update()` flow and answers with the identical serialised session, so
 * blocking only GET blocks nothing — CSRF is no obstacle to a script that can
 * read `/api/auth/csrf` from the same origin. This was also verified rather
 * than assumed: with GET returning 404, a form-encoded POST carrying a fetched
 * csrfToken still answered 200 with the access token.
 *
 * Blocked rather than filtered, because Auth.js builds that response from the
 * same `session` callback `auth()` uses — there is no way to return one shape
 * to the server and a redacted one to the browser.
 *
 * Nothing legitimate calls it here: this app has no client-side session (no
 * `SessionProvider`, no `useSession`, enforced by
 * `auth.session-exposure.test.ts`). Sign-in, sign-out and the OAuth callback
 * are separate paths and stay reachable. If a client-side session is ever
 * genuinely wanted, the fix is to stop putting the token on the session — not
 * to reopen this route.
 */
const SESSION_ENDPOINT = "/api/auth/session";

type AuthRequest = Parameters<typeof handlers.GET>[0];

function isSessionEndpoint(request: AuthRequest): boolean {
  return new URL(request.url).pathname === SESSION_ENDPOINT;
}

export async function GET(request: AuthRequest): Promise<Response> {
  if (isSessionEndpoint(request)) return new Response(null, { status: 404 });
  return handlers.GET(request);
}

export async function POST(request: AuthRequest): Promise<Response> {
  if (isSessionEndpoint(request)) return new Response(null, { status: 404 });
  return handlers.POST(request);
}
