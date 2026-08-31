import type { MetadataRoute } from "next";

import { BLOG_POSTS } from "@/domains/marketing/blog-content";
import { siteUrl } from "@/lib/brand/site-origin";

/**
 * Every page a crawler should index.
 *
 * `lastModified` is set only where a real date exists, which is the posts.
 * Stamping `new Date()` on the static pages would rewrite the whole sitemap on
 * every deploy and tell Google that six pages changed when none did, which is
 * worse than saying nothing about them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/about", "/blog", "/privacy", "/terms", "/cookies"].map(
    (path) => ({ url: siteUrl(path) }),
  );

  const posts = BLOG_POSTS.map((post) => ({
    url: siteUrl(`/blog/${post.slug}`),
    lastModified: post.publishedAt,
  }));

  return [...pages, ...posts];
}
