import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BLOG_POSTS, findPost } from "@/domains/marketing/blog-content";
import { BlogPostPage } from "@/domains/marketing/blog-post";

/**
 * Prerendered from the constant, so every published post is in the build
 * output and the route needs nothing at request time.
 */
export function generateStaticParams(): { slug: string }[] {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);

  // The page below answers 404 for the same slug. Returning nothing
  // descriptive here keeps a missing post from being indexed under a title.
  if (!post) return {};

  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.summary,
      publishedTime: post.publishedAt,
    },
    twitter: { title: post.title, description: post.summary },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findPost(slug);

  // A slug that was never published, or one that was renamed after being
  // shared. Both are 404s; neither should render an empty post shell.
  if (!post) notFound();

  return <BlogPostPage post={post} />;
}
