import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import { isPublicPath, PUBLIC_PAGE_PATHS } from "@/domains/auth/public-paths";
import { listPosts } from "@/domains/marketing/blog-content";
import { SITE_ORIGIN, siteUrl } from "@/lib/brand/site-origin";

describe("sitemap", () => {
  it("lists every published post", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    // A post absent here is a post nobody finds. Both sides scan the same
    // directory, so adding one cannot forget the sitemap.
    for (const post of await listPosts()) {
      expect(urls).toContain(`${SITE_ORIGIN}/blog/${post.slug}`);
    }
  });

  it("submits every public page, not just the ones somebody remembered", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    // The failure with no symptom: the page works and is never crawled.
    for (const path of PUBLIC_PAGE_PATHS) {
      expect(urls).toContain(siteUrl(path));
    }
  });

  it("names only pages that are actually public", async () => {
    // Submitting a gated path tells Google to crawl a redirect to Auth0.
    for (const entry of await sitemap()) {
      const path = entry.url.slice(SITE_ORIGIN.length);
      expect(isPublicPath(path === "" ? "/" : path)).toBe(true);
    }
  });

  it("uses absolute URLs on the canonical origin", async () => {
    for (const entry of await sitemap()) {
      expect(entry.url.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
    }
  });

  it("dates the posts and leaves the static pages undated", async () => {
    // `new Date()` on the static pages would rewrite the whole sitemap every
    // deploy and claim six pages changed when none did.
    const dated = (await sitemap()).filter(
      (entry) => entry.lastModified !== undefined,
    );

    expect(dated.map((entry) => entry.lastModified)).toEqual(
      (await listPosts()).map((post) => post.publishedAt),
    );
  });
});
