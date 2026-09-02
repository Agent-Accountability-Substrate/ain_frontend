import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { listPosts } from "@/domains/marketing/blog-content";
import { BlogIndex } from "@/domains/marketing/blog-index";

describe("BlogIndex", () => {
  it("links every published post at its own address", async () => {
    render(await BlogIndex());

    for (const post of await listPosts()) {
      // A predicate rather than `new RegExp(post.title)`: a title is prose, and
      // prose carries `?` and brackets. Compiled as a pattern, "Who is
      // accountable? (Part 1)" stops matching the link it names, and an
      // unbalanced bracket throws before the assertion is reached.
      const link = screen.getByRole("link", {
        name: (accessibleName) => accessibleName.includes(post.title),
      });
      expect(link.getAttribute("href")).toBe(`/blog/${post.slug}`);
    }
  });

  it("leads with the newest post", async () => {
    render(await BlogIndex());
    const lead = (await listPosts())[0]!;

    // The lead is the one entry carrying the summary and the Latest marker; a
    // uniform list reads as an archive whatever is in it.
    const marker = screen.getByText("Latest");
    const card = marker.closest("a")!;
    expect(card.getAttribute("href")).toBe(`/blog/${lead.slug}`);
    expect(card.textContent).toContain(lead.title);
    expect(card.textContent).toContain(lead.summary);
  });

  it("renders as a standalone public page", async () => {
    const { container } = render(await BlogIndex());

    expect(
      screen.getByRole("heading", { level: 1, name: "Insights" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Subra home" }).getAttribute("href"),
    ).toBe("/");
    expect(screen.getByRole("contentinfo")).toBeDefined();
    expect(container.textContent).not.toContain("—");
  });

  it("gives every entry a machine-readable date", async () => {
    const { container } = render(await BlogIndex());

    // The visible date is formatted for a reader; `dateTime` is what a feed
    // reader and a search engine parse, so it has to stay ISO. The footer
    // carries no <time>, so these are the posts' own.
    const times = Array.from(container.querySelectorAll("time"));
    expect(times.map((node) => node.getAttribute("datetime"))).toEqual(
      (await listPosts()).map((post) => post.publishedAt),
    );
  });

  it("lists nothing behind the lead until there is a second post", async () => {
    render(await BlogIndex());

    // The archive list is conditional. With one post published an empty
    // bordered list would render as a rule under the card with nothing in it.
    const earlier = screen.queryByRole("list", { name: "Earlier posts" });
    const published = (await listPosts()).length;
    if (published > 1) {
      expect(earlier).not.toBeNull();
      expect(earlier!.querySelectorAll("li").length).toBe(published - 1);
    } else {
      expect(earlier).toBeNull();
    }
  });
});
