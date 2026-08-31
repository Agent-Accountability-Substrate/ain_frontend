import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BLOG_POSTS } from "@/domains/marketing/blog-content";
import { BlogIndex } from "@/domains/marketing/blog-index";

describe("BlogIndex", () => {
  it("links every published post at its own address", () => {
    render(<BlogIndex />);

    for (const post of BLOG_POSTS) {
      const link = screen.getByRole("link", { name: new RegExp(post.title) });
      expect(link.getAttribute("href")).toBe(`/blog/${post.slug}`);
    }
  });

  it("leads with the newest post", () => {
    render(<BlogIndex />);
    const lead = BLOG_POSTS[0]!;

    // The lead is the one entry carrying the summary and the Latest marker; a
    // uniform list reads as an archive whatever is in it.
    const marker = screen.getByText("Latest");
    const card = marker.closest("a")!;
    expect(card.getAttribute("href")).toBe(`/blog/${lead.slug}`);
    expect(card.textContent).toContain(lead.title);
    expect(card.textContent).toContain(lead.summary);
  });

  it("renders as a standalone public page", () => {
    const { container } = render(<BlogIndex />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Insights" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Subra home" }).getAttribute("href"),
    ).toBe("/");
    expect(screen.getByRole("contentinfo")).toBeDefined();
    expect(container.textContent).not.toContain("—");
  });

  it("gives every entry a machine-readable date", () => {
    const { container } = render(<BlogIndex />);

    // The visible date is formatted for a reader; `dateTime` is what a feed
    // reader and a search engine parse, so it has to stay ISO. The footer
    // carries no <time>, so these are the posts' own.
    const times = Array.from(container.querySelectorAll("time"));
    expect(times.map((node) => node.getAttribute("datetime"))).toEqual(
      BLOG_POSTS.map((post) => post.publishedAt),
    );
  });

  it("lists nothing behind the lead until there is a second post", () => {
    render(<BlogIndex />);

    // The archive list is conditional. With one post published an empty
    // bordered list would render as a rule under the card with nothing in it.
    const earlier = screen.queryByRole("list", { name: "Earlier posts" });
    if (BLOG_POSTS.length > 1) {
      expect(earlier).not.toBeNull();
      expect(earlier!.querySelectorAll("li").length).toBe(
        BLOG_POSTS.length - 1,
      );
    } else {
      expect(earlier).toBeNull();
    }
  });
});
