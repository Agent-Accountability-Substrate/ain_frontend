import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Page, { generateMetadata } from "@/app/blog/[slug]/page";
import { listPosts } from "@/domains/marketing/blog-content";

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

// `blog-content.test.ts` holds the directory non-empty.
const post = (await listPosts())[0]!;

describe("the blog post route", () => {
  it("refuses a slug that is not one", async () => {
    // The slug reaches a module specifier, so its shape is checked before the
    // lookup rather than left to whatever the lookup happens to resolve.
    for (const slug of ["../probe", "a/b", "Upper", "trailing-", ""]) {
      await expect(Page({ params: Promise.resolve({ slug }) })).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );
    }
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
