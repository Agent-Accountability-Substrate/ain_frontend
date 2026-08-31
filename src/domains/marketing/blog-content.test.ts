import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  BLOG_POSTS,
  findPost,
  formatPublishedDate,
} from "@/domains/marketing/blog-content";

describe("blog content", () => {
  it("publishes at least one post", () => {
    // The index has no empty state, and an Insights link in the footer that
    // lands on nothing is worse than no link.
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
  });

  it("gives every post a unique slug", () => {
    // The shape of a slug is enforced by the schema at module load; this is
    // the part a schema per post cannot see.
    const slugs = BLOG_POSTS.map((post) => post.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("orders posts newest first", () => {
    // The list is hand-ordered rather than sorted, so this is the only thing
    // holding the invariant the index renders on.
    const dates = BLOG_POSTS.map((post) => Date.parse(post.publishedAt));

    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it("writes the prose without em dashes", () => {
    // The house rule every rendered page is asserted against. The body is
    // markdown now, so this renders each post rather than reading its strings:
    // there is no longer a field to inspect.
    for (const post of BLOG_POSTS) {
      const { container } = render(createElement(post.Content));

      expect(container.textContent).not.toContain("—");
      expect(
        [post.title, post.summary, post.standfirst].join(" "),
      ).not.toContain("—");
    }
  });

  it("gives every post a body with something in it", () => {
    // A post whose markdown failed to compile still satisfies the schema,
    // because the schema only sees `meta`.
    for (const post of BLOG_POSTS) {
      const { container } = render(createElement(post.Content));

      expect(container.querySelectorAll("h2").length).toBeGreaterThan(0);
      expect(container.textContent!.length).toBeGreaterThan(500);
    }
  });

  it("finds a published post and nothing else", () => {
    const first = BLOG_POSTS[0]!;

    expect(findPost(first.slug)).toBe(first);
    expect(findPost("not-a-post")).toBeUndefined();
  });

  it("formats the date in UTC, so it cannot shift a day by host", () => {
    // Left to the host locale this renders as 30 August anywhere west of UTC,
    // and the server and the browser disagree about the same post.
    expect(formatPublishedDate("2026-08-31")).toBe("31 August 2026");
    expect(formatPublishedDate("2026-01-01")).toBe("1 January 2026");
  });
});
