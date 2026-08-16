import "server-only";

import { z } from "zod";

import { auth } from "@/auth";
import { getServerEnv } from "@/lib/server-env";

/**
 * The Data Access Layer for `ain_backend_api` — the only module that holds the
 * API origin or the caller's bearer token (Next 16.3 guidance: a `server-only`
 * DAL owns `process.env` access, so secrets never spread through the tree).
 *
 * Two things this deliberately does not do. It does not accept a token as an
 * argument: callers cannot supply one, so no route can be tricked into
 * forwarding someone else's. And it does not export the token — only the parsed
 * result of a call — so nothing downstream can pass it to a client component.
 *
 * Every response is parsed with Zod before it leaves this module, per the repo
 * rule. The backend is trusted for correctness, not for shape: a contract drift
 * should surface here as a loud failure rather than as `undefined` rendering
 * halfway down a page.
 */

/** Local default matching `uvicorn ain_backend_api.app:create_app --factory`. */
const LOCAL_API_BASE_URL = "http://127.0.0.1:8000";

/** The registry could not be reached, or answered in a way we cannot use. */
export class RegistryUnavailableError extends Error {}

/** No usable session — the caller must authenticate before this can work. */
export class NotAuthenticatedError extends Error {}

const whoAmISchema = z.object({
  subject: z.string(),
  organisation_id: z.uuid(),
  roles: z.array(z.string()),
});

/** The caller's own identity and authority, as the registry sees it. */
export type WhoAmI = z.infer<typeof whoAmISchema>;

function baseUrl(): string {
  return getServerEnv().AIN_API_BASE_URL ?? LOCAL_API_BASE_URL;
}

async function get(path: string): Promise<unknown> {
  const session = await auth();
  // Absent covers both "not signed in" and "access token expired", which the
  // session callback collapses on purpose — neither can be fixed by retrying
  // the request, and both are fixed by signing in again.
  if (!session?.accessToken) throw new NotAuthenticatedError();

  let response: Response;
  try {
    response = await fetch(new URL(path, baseUrl()), {
      headers: { authorization: `Bearer ${session.accessToken}` },
      // Authority is re-read from the registry on every backend request, so a
      // cached response would reinstate exactly the staleness that reading it
      // per request exists to avoid.
      cache: "no-store",
    });
  } catch (cause) {
    // A transport failure is not an authorisation outcome; keep them distinct
    // so the UI never renders "you lack permission" for a connection refused.
    throw new RegistryUnavailableError(
      `could not reach the registry: ${path}`,
      {
        cause,
      },
    );
  }

  if (response.status === 401) throw new NotAuthenticatedError();
  if (!response.ok) {
    throw new RegistryUnavailableError(
      `registry answered ${response.status} for ${path}`,
    );
  }
  return response.json();
}

/**
 * `GET /auth/whoami` — the authenticated echo.
 *
 * Worth more than it looks: the organisation and roles it returns are resolved
 * from the caller's `app_user` row, not from the token, so a successful call
 * proves the whole chain — audience requested, Action stamping its claims,
 * backend verifying, membership row found.
 */
export async function whoAmI(): Promise<WhoAmI> {
  return whoAmISchema.parse(await get("/auth/whoami"));
}
