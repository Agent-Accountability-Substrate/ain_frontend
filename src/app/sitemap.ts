import type { MetadataRoute } from "next";

import { PUBLIC_PAGE_PATHS } from "@/domains/auth/public-paths";
import { listPosts } from "@/domains/marketing/blog-content";
import { siteUrl } from "@/lib/brand/site-origin";

/**
 * Every page a crawler should index. Both halves read off what the routes are
 * built from — the gate's allowlist and the posts directory — so adding either
 * cannot forget the sitemap.
 *
 * `lastModified` only where a real date exists, which is the posts. Stamping
 * `new Date()` on the static pages would rewrite the whole file every deploy
 * and claim six pages changed when none did.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = PUBLIC_PAGE_PATHS.map((path) => ({ url: siteUrl(path) }));

  const posts = (await listPosts()).map((post) => ({
    url: siteUrl(`/blog/${post.slug}`),
    lastModified: post.publishedAt,
  }));

  return [...pages, ...posts];
}
