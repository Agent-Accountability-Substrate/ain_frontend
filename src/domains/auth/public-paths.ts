/**
 * What is reachable without a session.
 *
 * Lives here rather than inside `@/auth` so it can be tested on its own:
 * importing that module constructs the Auth.js handler and demands the whole
 * environment.
 *
 * Deny-by-default: everything not named here needs a session.
 */

/** The addresses people type for a login. All four forward to Auth0. */
const AUTH_ENTRY_PATHS = new Set(["/signin", "/login", "/signup", "/register"]);

/**
 * Next's file-based metadata routes, which are generated from files beside
 * `app/layout.tsx` rather than written as pages.
 *
 * These must be public or they are worse than missing. A favicon behind the
 * session gate answers a redirect, and `opengraph-image` behind it sends every
 * social scraper — X, Slack, LinkedIn — to Auth0, so the share card renders
 * nothing.
 *
 * `public-paths.test.ts` reads `src/app` and fails if a metadata file is added
 * that this does not cover, so the list cannot fall behind the directory.
 */
const METADATA_ROUTES = new Set([
  "/favicon.ico",
  "/icon.svg",
  "/apple-icon.png",
  "/opengraph-image",
  "/twitter-image",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

/**
 * Next's disambiguating suffix on a metadata file that sits under a `(group)`
 * or an `@slot`: a short hash of the parent path, appended to the name and
 * before any extension — `/opengraph-image` is served at
 * `/opengraph-image-pwu6ef`, `/icon.svg` at `/icon-pwu6ef.svg`.
 *
 * Stripped rather than enumerated, because the hash is derived from the
 * group's name: listing it would mean re-deriving every entry the day someone
 * renames a route group, and the list falling silently out of date if they
 * forget. The paths it widens are metadata names that exist only as metadata
 * routes; anything else still answers 404, session or no session.
 */
const GROUP_HASH = /-[0-9a-z]{6}(?=$|\.)/;

export function isPublicPath(pathname: string): boolean {
  // Auth.js's own routes must stay public or sign-in loops.
  if (pathname.startsWith("/api/auth")) return true;
  if (AUTH_ENTRY_PATHS.has(pathname)) return true;
  if (METADATA_ROUTES.has(pathname.replace(GROUP_HASH, ""))) return true;
  return pathname === "/";
}
