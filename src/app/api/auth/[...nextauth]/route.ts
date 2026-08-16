import { handlers } from "@/auth";

/**
 * Auth.js's own endpoints, with one deliberately removed.
 *
 * `GET /api/auth/session` serialises the session to JSON for anything holding
 * the cookie — including ordinary client-side JavaScript. Since the session
 * carries the bearer token for `ain_backend_api`, leaving that route reachable
 * hands a registry API credential to any script on the page. Verified, not
 * theorised: a `fetch('/api/auth/session')` from the page context returned the
 * access token in full.
 *
 * Blocked rather than filtered, because Auth.js builds that response from the
 * same `session` callback `auth()` uses — there is no way to return one shape
 * to the server and a redacted one to the browser.
 *
 * Nothing legitimate calls it here: this app has no client-side session (no
 * `SessionProvider`, no `useSession`, enforced by
 * `auth.session-exposure.test.ts`). If a client-side session is ever genuinely
 * wanted, the fix is to stop putting the token on the session — not to reopen
 * this route.
 */
const SESSION_ENDPOINT = "/api/auth/session";

type AuthRequest = Parameters<typeof handlers.GET>[0];

export async function GET(request: AuthRequest): Promise<Response> {
  if (new URL(request.url).pathname === SESSION_ENDPOINT) {
    return new Response(null, { status: 404 });
  }
  return handlers.GET(request);
}

export const { POST } = handlers;
