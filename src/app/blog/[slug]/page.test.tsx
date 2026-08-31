import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Page, {
  generateMetadata,
  generateStaticParams,
} from "@/app/blog/[slug]/page";
import { BLOG_POSTS } from "@/domains/marketing/blog-content";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    // The real one throws to unwind the render, and callers are written
    // assuming it never returns.
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("next/navigation", () => ({ notFound }));

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

// `blog-content.test.ts` holds the list non-empty.
const post = BLOG_POSTS[0]!;

describe("the blog post route", () => {
  it("prerenders every published post", () => {
    // Without this the posts are built on demand, so the first visitor to each
    // pays for the render and a build failure in one surfaces in production.
    expect(generateStaticParams()).toEqual(
      BLOG_POSTS.map(({ slug }) => ({ slug })),
    );
  });

  it("renders the post at its slug", async () => {
    render(await Page({ params: Promise.resolve({ slug: post.slug }) }));

    expect(
      screen.getByRole("heading", { level: 1, name: post.title }),
    ).toBeDefined();
    expect(auth).not.toHaveBeenCalled();
  });

  it("answers 404 for a slug that was never published", async () => {
    // A renamed post keeps its old address alive in somebody's bookmarks. That
    // is a 404, not an empty post shell rendered around nothing.
    await expect(
      Page({ params: Promise.resolve({ slug: "not-a-post" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("publishes the post's own title, description and canonical", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: post.slug }),
    });

    expect(meta).toMatchObject({
      title: post.title,
      description: post.summary,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        type: "article",
        url: `/blog/${post.slug}`,
        publishedTime: post.publishedAt,
      },
    });
  });

  it("describes nothing for a missing post", async () => {
    // The page 404s the same slug. Titling it anyway is how a dead address
    // gets indexed under a real-looking heading.
    expect(
      await generateMetadata({
        params: Promise.resolve({ slug: "not-a-post" }),
      }),
    ).toEqual({});
  });
});
