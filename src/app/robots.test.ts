import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { AUTH_ENTRY_PATHS, isPublicPath } from "@/domains/auth/public-paths";
import { SITE_ORIGIN } from "@/lib/brand/site-origin";

describe("robots", () => {
  it("points crawlers at the sitemap on the canonical origin", () => {
    // Relative is not allowed here: a crawler reads robots.txt from whatever
    // host served it, and a preview deployment would advertise its own.
    expect(robots().sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
  });

  it("disallows only paths the session gate protects, or a login address", () => {
    const { disallow } = robots().rules as { disallow: string[] };

    // A public information page listed here is deindexed silently, which
    // looks like an SEO problem and is a config one. Trailing slashes are a
    // robots.txt prefix, not part of the path.
    for (const path of disallow) {
      const pathname = path.replace(/\/$/, "");
      if (AUTH_ENTRY_PATHS.has(pathname)) continue;
      expect(isPublicPath(pathname)).toBe(false);
    }
  });

  it("keeps every login address out of the index", () => {
    const { disallow } = robots().rules as { disallow: string[] };

    // Public, because the gate has to let a sign-in start, and each answers
    // a redirect to Auth0. The other assertion only checks the paths that are
    // listed, never that a path which should be is.
    for (const path of AUTH_ENTRY_PATHS) {
      expect(disallow).toContain(path);
    }
  });

  it("allows the site by default", () => {
    const { userAgent, allow } = robots().rules as {
      userAgent: string;
      allow: string;
    };

    expect(userAgent).toBe("*");
    expect(allow).toBe("/");
  });
});
