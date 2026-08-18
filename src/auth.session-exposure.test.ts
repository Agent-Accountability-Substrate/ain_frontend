import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * An architecture test, not a unit test.
 *
 * The session carries the bearer token for `ain_backend_api`. That is safe only
 * while the session stays on the server: this app reads it exclusively through
 * `auth()` in server components, and has no `SessionProvider` and no
 * `useSession`. Introducing either would serialise the session into the React
 * payload and ship a registry API token to the browser — a change that looks
 * completely ordinary in review and leaks a credential.
 *
 * A comment cannot enforce that, so this does. If a client-side session is ever
 * genuinely wanted, the fix is to stop putting the token on the session (proxy
 * calls through the DAL instead) and then delete this test — not to relax it.
 */

const SOURCE_ROOT = join(import.meta.dirname);

/**
 * Matches the *import* rather than the word, so documentation explaining why
 * these are banned does not trip the rule that bans them. `next-auth/react` is
 * the only route to a client-side session, so importing anything from it is
 * the signal — narrower and harder to work around than naming each symbol.
 */
const CLIENT_SESSION_IMPORT = /from\s+["']next-auth\/react["']/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) && !entry.includes(".test.") ? [path] : [];
  });
}

describe("session exposure", () => {
  it("keeps the access-token-bearing session off the client", () => {
    const offenders = sourceFiles(SOURCE_ROOT)
      .filter((path) => CLIENT_SESSION_IMPORT.test(readFileSync(path, "utf8")))
      .map((path) => path.slice(SOURCE_ROOT.length + 1));

    expect(offenders).toEqual([]);
  });
});
