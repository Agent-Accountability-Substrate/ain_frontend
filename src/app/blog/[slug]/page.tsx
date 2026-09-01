import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findPost } from "@/domains/marketing/blog-content";
import { BlogPostPage } from "@/domains/marketing/blog-post";
import { OG_IMAGE } from "@/lib/brand/site-origin";

/**
 * No `generateStaticParams`. A post is a file in `posts/`, and the route loads
 * it by slug, so there is no list to enumerate at build time and adding a post
 * needs no edit here. Next renders each on demand and keeps the result.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPost(slug);

  // The page answers 404 for the same slug. Returning nothing descriptive
  // keeps a missing post from being indexed under a title.
  if (!post) return {};

  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    // Declaring `openGraph` replaces the layout's resolved object rather than
    // merging into it, taking the root's file-convention share image with it.
    // Without `images` here a post shares as a bare text card, and
    // `twitter.images` — which falls back to this — is empty too.
    openGraph: {
      type: "article",
      siteName: "AIN Registry",
      locale: "en_GB",
      url,
      title: post.title,
      description: post.summary,
      publishedTime: post.publishedAt,
      images: OG_IMAGE,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: OG_IMAGE,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await findPost(slug);

  // A slug that was never published, or one renamed after being shared.
  if (!post) notFound();

  return <BlogPostPage post={post} />;
}
