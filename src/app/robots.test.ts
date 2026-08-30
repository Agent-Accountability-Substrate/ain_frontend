import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import {
  AUTH_ENTRY_PATHS,
  isPublicPath,
  PUBLIC_PAGE_PATHS,
} from "@/domains/auth/public-paths";
import { SITE_ORIGIN } from "@/lib/brand/site-origin";
import { appFiles } from "@test/app-router-files";

/** A file that answers at a URL, as opposed to a convention or a test beside one. */
const ROUTABLE = /^(page|route)\.(tsx?|jsx?)$/;

/**
 * One robots.txt rule against one path. A rule is a prefix unless it ends in
 * `$`, which anchors it to the end of the path (RFC 9309 §2.2.3).
 */
function covers(rule: string, pathname: string): boolean {
  return rule.endsWith("$")
    ? pathname === rule.slice(0, -1)
    : pathname.startsWith(rule);
}

describe("robots", () => {
  it("points crawlers at the sitemap on the canonical origin", () => {
    // Relative is not allowed here: a crawler reads robots.txt from whatever
    // host served it, and a preview deployment would advertise its own.
    expect(robots().sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
  });

  it("disallows only paths the session gate protects, or a login address", () => {
    const { disallow } = robots().rules as { disallow: string[] };

    // A public information page listed here is deindexed silently, which
    // looks like an SEO problem and is a config one. Neither a trailing slash
    // nor a trailing `$` is part of the path they match.
    for (const path of disallow) {
      const pathname = path.replace(/\$$/, "").replace(/\/$/, "");
      if (AUTH_ENTRY_PATHS.has(pathname)) continue;
      expect(isPublicPath(pathname)).toBe(false);
    }
  });

  it("keeps the public site out of the disallow list, share card included", () => {
    const { disallow } = robots().rules as { disallow: string[] };

    // The other direction of the same list. `Disallow` is a prefix and the
    // organisation segment is one letter, so a bare `/o` also matches
    // `/opengraph-image` — the card every social scraper fetches, and the
    // route the landing rebuild had just stopped answering 307 to. `/o$`
    // is what keeps the two apart, and nothing else here would notice.
    for (const pathname of [
      ...PUBLIC_PAGE_PATHS,
      "/blog/the-accountability-gap-in-autonomous-ai",
      "/opengraph-image",
    ]) {
      expect(
        disallow.some((rule) => covers(rule, pathname)),
        `${pathname} is public and must not be disallowed`,
      ).toBe(false);
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

      // A route is covered when any rule matches it.
      expect(
        disallow.some((rule) => covers(rule, file.segment)),
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
