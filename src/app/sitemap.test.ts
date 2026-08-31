import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { isPublicPath } from "@/domains/auth/public-paths";
import { BLOG_POSTS } from "@/domains/marketing/blog-content";
import { SITE_ORIGIN } from "@/lib/brand/site-origin";

describe("sitemap", () => {
  it("lists every published post", () => {
    const urls = sitemap().map((entry) => entry.url);

    // A post absent here is a post nobody finds. This is read off the same
    // constant the routes are, so adding one cannot forget the sitemap.
    for (const post of BLOG_POSTS) {
      expect(urls).toContain(`${SITE_ORIGIN}/blog/${post.slug}`);
    }
  });

  it("names only pages that are actually public", () => {
    // Submitting a gated path tells Google to crawl a redirect to Auth0.
    for (const entry of sitemap()) {
      const path = entry.url.slice(SITE_ORIGIN.length);
      expect(isPublicPath(path === "" ? "/" : path)).toBe(true);
    }
  });

  it("uses absolute URLs on the canonical origin", () => {
    for (const entry of sitemap()) {
      expect(entry.url.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
    }
  });

  it("dates the posts and leaves the static pages undated", () => {
    // `new Date()` on the static pages would rewrite the whole sitemap every
    // deploy and claim six pages changed when none did.
    const dated = sitemap().filter((entry) => entry.lastModified !== undefined);

    expect(dated.map((entry) => entry.lastModified)).toEqual(
      BLOG_POSTS.map((post) => post.publishedAt),
    );
  });
});
