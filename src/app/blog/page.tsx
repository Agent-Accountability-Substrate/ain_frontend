import type { Metadata } from "next";

import { BLOG_DESCRIPTION, BLOG_TITLE } from "@/domains/marketing/blog-content";
import { BlogIndex } from "@/domains/marketing/blog-index";

export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    url: "/blog",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
  },
};

export default function BlogPage() {
  return <BlogIndex />;
}
