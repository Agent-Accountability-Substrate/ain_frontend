import type { MetadataRoute } from "next";

import { AUTH_ENTRY_PATHS } from "@/domains/auth/public-paths";
import { siteUrl } from "@/lib/brand/site-origin";

/**
 * Everything behind the session gate. Listing it keeps a set of redirects out
 * of the index and out of the crawl budget.
 *
 * `Disallow` matches a prefix, not a path segment, so: a trailing slash where
 * the segment has only children, none where it has a page of its own.
 *
 * Written out rather than derived, because a crawler needs prefixes and the
 * gate answers about one path at a time. `robots.test.ts` walks `src/app` and
 * fails if a route needing a session is not covered here, so the list cannot
 * fall behind the routes the way it otherwise would.
 */
const GATED_PREFIXES = [
  "/api/",
  "/account",
  "/agents/",
  "/dashboard",
  "/onboarding/",
  "/operations",
  "/organisations",
];

/**
 * Everything public is allowed except the four login addresses. The gate has
 * to let those through or signing in loops, but each is a redirect to Auth0
 * linked from the landing page, so a crawler follows all four every pass.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...GATED_PREFIXES, ...AUTH_ENTRY_PATHS].sort(),
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
