import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/domains/auth/public-paths";
import { appFiles, type AppFile } from "@test/app-router-files";

/** Next's file-based metadata conventions, as they appear beside `layout.tsx`. */
const METADATA_FILE =
  /^(favicon\.ico|icon|apple-icon|opengraph-image|twitter-image|robots|sitemap|manifest)\d*(\.[a-z0-9]+)?$/;

/** The path a metadata file is actually served at. */
function routeFor(file: AppFile): string {
  const prefix = file.segment === "/" ? "" : file.segment;
  // A code file generates its route without an extension — `opengraph-image.tsx`
  // is served at `/opengraph-image`. An asset keeps its own.
  const generated = /\.(tsx?|jsx?|mjs)$/.test(file.name);
  if (!generated) return `${prefix}/${file.name}`;
  const base = file.name.replace(/\.(tsx?|jsx?|mjs)$/, "");
  if (base === "robots") return `${prefix}/robots.txt`;
  if (base === "sitemap") return `${prefix}/sitemap.xml`;
  if (base === "manifest") return `${prefix}/manifest.webmanifest`;
  return `${prefix}/${base}`;
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
    expect(isPublicPath("/api/auth/callback/auth0")).toBe(true);
  });

  it("lets all four login addresses through", () => {
    // The gate runs before the handler, so a protected /signin would block the
    // very redirect that starts a login.
    for (const path of ["/signin", "/login", "/signup", "/register"]) {
      expect(isPublicPath(path)).toBe(true);
    }
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
