import type { Metadata } from "next";

import { BLOG_DESCRIPTION, BLOG_TITLE } from "@/domains/marketing/blog-content";
import { BlogIndex } from "@/domains/marketing/blog-index";
import { OG_IMAGE } from "@/lib/brand/site-origin";

export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
  // Declaring `openGraph` replaces the layout's resolved object rather than
  // merging into it, so `type`, `siteName`, `locale` and `images` are restated
  // or the section shares as a bare text card. `twitter` likewise: left off it
  // keeps the root's title and advertises a different one to X than to
  // everybody else.
  openGraph: {
    type: "website",
    siteName: "AIN Registry",
    locale: "en_GB",
    url: "/blog",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    images: OG_IMAGE,
  },
  twitter: {
    card: "summary_large_image",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    images: OG_IMAGE,
  },
};

// Awaited here rather than returned as an element, so what the page renders is
// the resolved index. React would resolve it either way; a test cannot.
export default async function BlogPage() {
  return await BlogIndex();
}
