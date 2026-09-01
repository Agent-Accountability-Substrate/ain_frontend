import {
  normalizeMetadataPageToRoute,
  normalizeMetadataRoute,
} from "next/dist/lib/metadata/get-metadata-route";
import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/domains/auth/public-paths";
import { appFiles, type AppFile } from "@test/app-router-files";

/** Next's file-based metadata conventions, as they appear beside `layout.tsx`. */
const METADATA_FILE =
  /^(favicon\.ico|icon|apple-icon|opengraph-image|twitter-image|robots|sitemap|manifest)\d*(\.[a-z0-9]+)?$/;

/**
 * The path a metadata file is actually served at, asked of Next rather than
 * worked out here. The mapping is not the tidy one it looks like: `robots.tsx`
 * answers at `/robots.txt`, `sitemap.ts` at `/sitemap.xml`, and a file under a
 * `(group)` carries a hash of its parent path in its name. Re-deriving it here
 * is how a guard comes to check a path nothing serves.
 *
 * The import reaches into Next's internals deliberately: if it moves, this
 * fails loudly at the import rather than quietly at the assertion.
 */
function routeFor(file: AppFile): string {
  const parent = file.dir === "/" ? "" : file.dir;
  // A code file generates its route without an extension — `opengraph-image.tsx`
  // is served at `/opengraph-image`. An asset keeps its own.
  const base = file.name.replace(/\.(tsx?|jsx?|mjs)$/, "");
  // Two steps: Next splits the mapping across two functions and only the
  // second knows a sitemap is served with an `.xml` extension.
  const route = normalizeMetadataPageToRoute(
    normalizeMetadataRoute(`${parent}/${base}`),
    false,
  ).replace(/\/route$/, "");
  // Groups and slots contribute no URL segment of their own.
  return `/${route
    .split("/")
    .filter(
      (segment) =>
        segment && !segment.startsWith("(") && !segment.startsWith("@"),
    )
    .join("/")}`;
}

describe("isPublicPath", () => {
  it("keeps the workspace behind the session gate", () => {
    for (const path of [
      "/dashboard",
      "/organisations",
      "/operations",
      "/account",
      "/agents/new",
      "/onboarding/identity",
    ]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });

  it("lets the landing page and Auth.js's own routes through", () => {
    expect(isPublicPath("/")).toBe(true);
    for (const path of ["/about", "/blog", "/cookies", "/privacy", "/terms"]) {
      expect(isPublicPath(path)).toBe(true);
    }
    expect(isPublicPath("/api/auth/callback/auth0")).toBe(true);
  });

  it("lets every blog post through, not just the index", () => {
    // The page list is exact, so a dynamic `/blog/<slug>` falls past it to
    // deny-by-default unless the prefix arm catches it.
    expect(isPublicPath("/blog/the-accountability-gap-in-autonomous-ai")).toBe(
      true,
    );
    expect(isPublicPath("/blog/anything-published-later")).toBe(true);

    // The prefix is a path segment, not five characters.
    expect(isPublicPath("/blogging-tools")).toBe(false);
  });

  it("lets all four login addresses through", () => {
    // The gate runs before the handler, so a protected /signin would block the
    // very redirect that starts a login.
    for (const path of ["/signin", "/login", "/signup", "/register"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("reads a grouped metadata file at the name Next actually serves it under", () => {
    // A route group is transparent to the URL but not to metadata routing:
    // Next appends a hash of the parent path so two `opengraph-image` files
    // cannot collide. A guard that checked `/opengraph-image` would pass while
    // the served path sat behind the session gate.
    const grouped = routeFor({
      name: "opengraph-image.tsx",
      segment: "/",
      dir: "/(marketing)",
    });

    expect(grouped).toMatch(/^\/opengraph-image-[0-9a-z]{6}$/);
    expect(isPublicPath(grouped)).toBe(true);

    // The suffix is Next's shape, not any six characters after a dash.
    expect(isPublicPath("/dashboard-abc123")).toBe(false);
    expect(isPublicPath("/opengraph-image-tooshort")).toBe(false);
  });

  it("serves every metadata file the app actually has", () => {
    const routes = appFiles()
      .filter((file) => METADATA_FILE.test(file.name))
      .map(routeFor);

    // Read off the directory to the leaves, not typed out again. A favicon
    // behind the gate answers a redirect; `opengraph-image` behind it sends
    // every social scraper to Auth0, so the share card renders nothing — and
    // one added under a nested segment is behind the gate by default.
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.filter((route) => !isPublicPath(route))).toEqual([]);
  });
});
