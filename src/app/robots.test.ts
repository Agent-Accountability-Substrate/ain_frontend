import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { AUTH_ENTRY_PATHS, isPublicPath } from "@/domains/auth/public-paths";
import { SITE_ORIGIN } from "@/lib/brand/site-origin";
import { appFiles } from "@test/app-router-files";

/** A file that answers at a URL, as opposed to a convention or a test beside one. */
const ROUTABLE = /^(page|route)\.(tsx?|jsx?)$/;

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

  it("disallows every route the session gate protects", () => {
    const { disallow } = robots().rules as { disallow: string[] };

    // The direction nothing checked. `GATED_PREFIXES` is written out by hand
    // while the gate holds the same knowledge negatively, so adding an
    // authenticated section and forgetting the prefix left the whole thing
    // crawlable, with every crawler indexing its redirect to Auth0, and the
    // suite green. Read off `src/app` rather than a list typed out again, the
    // way the metadata guard in `public-paths.test.ts` is.
    for (const file of appFiles()) {
      if (!ROUTABLE.test(file.name)) continue;
      if (isPublicPath(file.segment)) continue;

      // `Disallow` matches a prefix, so a route is covered when any entry
      // begins it.
      expect(
        disallow.some((prefix) => file.segment.startsWith(prefix)),
        `${file.segment} needs a session and is not disallowed in robots.txt`,
      ).toBe(true);
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
