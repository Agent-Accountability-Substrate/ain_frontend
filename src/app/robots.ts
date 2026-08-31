import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/brand/site-origin";

/**
 * What a crawler may read.
 *
 * Everything public is allowed; everything behind the session gate is named as
 * disallowed. The gate already redirects those paths to Auth0, so a crawler
 * that ignores this file still reaches nothing. Listing them keeps a set of
 * redirects out of the index and out of the crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account",
        "/agents/",
        "/dashboard",
        "/onboarding/",
        "/operations",
        "/organisations",
      ],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
