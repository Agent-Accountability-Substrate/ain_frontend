import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { isPublicPath } from "@/domains/auth/public-paths";
import { SITE_ORIGIN } from "@/lib/brand/site-origin";

describe("robots", () => {
  it("points crawlers at the sitemap on the canonical origin", () => {
    // Relative is not allowed here: a crawler reads robots.txt from whatever
    // host served it, and a preview deployment would advertise its own.
    expect(robots().sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
  });

  it("disallows only paths the session gate already protects", () => {
    const { disallow } = robots().rules as { disallow: string[] };

    // Drifting apart is the failure that matters: a public page listed here
    // is deindexed silently, which looks like an SEO problem and is a config
    // one. Trailing slashes are a robots.txt prefix, not part of the path.
    for (const path of disallow) {
      expect(isPublicPath(path.replace(/\/$/, ""))).toBe(false);
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
