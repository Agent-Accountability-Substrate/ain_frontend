/**
 * What is reachable without a session.
 *
 * Lives here rather than inside `@/auth` so it can be tested on its own:
 * importing that module constructs the Auth.js handler and demands the whole
 * environment.
 *
 * Deny-by-default: everything not named here needs a session.
 */

/**
 * The addresses people type for a login. All four forward to Auth0, and
 * `robots.ts` reads them from here so the two cannot disagree.
 */
export const AUTH_ENTRY_PATHS = new Set([
  "/signin",
  "/login",
  "/signup",
  "/register",
]);

/**
 * Every page a stranger can reach by typing its address. `sitemap.ts` submits
 * exactly this list — the set a crawler may index and the set the gate lets
 * through are the same set. An array, so the sitemap's order is this order.
 *
 * Posts are not here: they are dynamic, matched by prefix below, and the
 * sitemap reads them off `listPosts()` in `marketing/blog-content.ts`, which
 * scans the posts directory. There is no registry constant.
 */
export const PUBLIC_PAGE_PATHS = [
  "/",
  "/about",
  "/blog",
  "/cookies",
  "/privacy",
  "/terms",
] as const;

const PUBLIC_PAGE_PATH_SET: ReadonlySet<string> = new Set(PUBLIC_PAGE_PATHS);

/**
 * Post routes are dynamic, so they are matched by prefix rather than listed.
 * The trailing slash is load bearing: a bare `startsWith("/blog")` would also
 * open anything merely beginning with those five characters.
 */
function isBlogPost(pathname: string): boolean {
  return pathname.startsWith("/blog/");
}

/**
 * Next's file-based metadata routes, generated from files beside
 * `app/layout.tsx` rather than written as pages. These must be public or they
 * are worse than missing: `opengraph-image` behind the gate sends every social
 * scraper to Auth0 and the share card renders nothing.
 *
 * `public-paths.test.ts` reads `src/app` and fails if a metadata file is added
 * that this does not cover.
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
 * Next's disambiguating suffix on a metadata file under a `(group)` or
 * `@slot`: a hash of the parent path before any extension, so
 * `/opengraph-image` is served at `/opengraph-image-pwu6ef`.
 *
 * Stripped rather than enumerated, since the hash changes with the group's
 * name. It only widens metadata names, which exist only as metadata routes.
 */
const GROUP_HASH = /-[0-9a-z]{6}(?=$|\.)/;

export function isPublicPath(pathname: string): boolean {
  // Auth.js's own routes must stay public or sign-in loops.
  if (pathname.startsWith("/api/auth")) return true;
  if (AUTH_ENTRY_PATHS.has(pathname)) return true;
  if (PUBLIC_PAGE_PATH_SET.has(pathname)) return true;
  if (isBlogPost(pathname)) return true;
  if (METADATA_ROUTES.has(pathname.replace(GROUP_HASH, ""))) return true;
  return false;
}
