import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BLOG_POSTS } from "@/domains/marketing/blog-content";
import { BlogPostPage } from "@/domains/marketing/blog-post";

// `blog-content.test.ts` holds the list non-empty.
const post = BLOG_POSTS[0]!;

describe("BlogPostPage", () => {
  it("renders the post as a standalone public page", () => {
    const { container } = render(<BlogPostPage post={post} />);

    expect(
      screen.getByRole("heading", { level: 1, name: post.title }),
    ).toBeDefined();
    expect(screen.getByText(post.standfirst)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Subra home" }).getAttribute("href"),
    ).toBe("/");
    expect(screen.getByRole("contentinfo")).toBeDefined();
    expect(container.textContent).not.toContain("—");
  });

  it("marks the body up as an article, not a document of clauses", () => {
    const { container } = render(<BlogPostPage post={post} />);
    const article = container.querySelector("article")!;

    // The markdown's own headings, under one h1, so the post has an outline a
    // reader and a crawler can both follow. Asserted against the text rather
    // than a count, because a body that failed to compile would still be an
    // article with an h1 in it.
    expect(
      within(article)
        .getAllByRole("heading", { level: 2 })
        .map((node) => node.textContent),
    ).toEqual([
      "Autonomy arrived before answerability",
      "Logs are not evidence",
      "Authority has to be declared before it can be checked",
      "The version problem nobody plans for",
      "Attest, do not gate",
      "What closing the gap actually requires",
      "Why this is worth building before it is demanded",
    ]);
  });

  it("numbers nothing", () => {
    render(<BlogPostPage post={post} />);

    // The legal notices index their sections because somebody cites section
    // four of a policy. Nobody cites section four of an essay, and carrying
    // the numbering over was the tell that the wrong shell was being reused.
    for (const heading of screen.getAllByRole("heading", { level: 2 })) {
      expect(heading.textContent).not.toMatch(/^\d/);
    }
  });

  it("dates the post in a form a machine can read", () => {
    const { container } = render(<BlogPostPage post={post} />);
    const time = container.querySelector("time")!;

    expect(time.getAttribute("datetime")).toBe(post.publishedAt);
    expect(time.textContent).toBe("31 August 2026");
  });

  it("leads back to the index, not the landing page", () => {
    render(<BlogPostPage post={post} />);

    // A post opened from a search result is the visitor's first page here, so
    // both ways out of it have to reach the rest of the writing.
    for (const name of ["All insights", "More insights"]) {
      expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(
        "/blog",
      );
    }
  });

  it("closes on the one form the rest of the site points at", () => {
    render(<BlogPostPage post={post} />);

    expect(
      screen.getByRole("link", { name: "Request access" }).getAttribute("href"),
    ).toBe("/#request");
    expect(
      screen
        .getAllByRole("link", { name: "partner@subrahq.com" })[0]!
        .getAttribute("href"),
    ).toBe("mailto:partner@subrahq.com");
  });
});
