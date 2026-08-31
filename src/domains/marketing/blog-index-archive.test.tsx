import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * The index with more than one post published.
 *
 * A lead-plus-list layout only has one of its two shapes exercised by the real
 * content while a single post exists, and the shape nobody sees is the one
 * that breaks: the archive list, its dates and its per-row links have never
 * rendered. Mocked rather than waiting for a second post to be written.
 */
vi.mock("@/domains/marketing/blog-content", () => ({
  BLOG_TITLE: "Insights",
  formatPublishedDate: (iso: string) => `formatted:${iso}`,
  BLOG_POSTS: [
    {
      slug: "newest",
      title: "The newest piece",
      summary: "What the lead card shows.",
      publishedAt: "2026-08-31",
      standfirst: "Stand.",
      Content: () => null,
    },
    {
      slug: "middle",
      title: "An earlier piece",
      summary: "What a row shows.",
      publishedAt: "2026-07-04",
      standfirst: "Stand.",
      Content: () => null,
    },
    {
      slug: "oldest",
      title: "The first piece",
      summary: "What another row shows.",
      publishedAt: "2026-06-01",
      standfirst: "Stand.",
      Content: () => null,
    },
  ],
}));

const { BlogIndex } = await import("@/domains/marketing/blog-index");

describe("BlogIndex with an archive", () => {
  it("leads with the newest and lists the rest", () => {
    render(<BlogIndex />);

    const lead = screen.getByText("Latest").closest("a")!;
    expect(lead.getAttribute("href")).toBe("/blog/newest");

    const earlier = screen.getByRole("list", { name: "Earlier posts" });
    expect(
      within(earlier)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/blog/middle", "/blog/oldest"]);
  });

  it("keeps the lead out of the list it leads", () => {
    render(<BlogIndex />);
    const earlier = screen.getByRole("list", { name: "Earlier posts" });

    // Rendering the newest post twice is the obvious way to get this wrong.
    expect(earlier.textContent).not.toContain("The newest piece");
    expect(within(earlier).getAllByRole("listitem").length).toBe(2);
  });

  it("dates every row, not just the lead", () => {
    const { container } = render(<BlogIndex />);

    expect(
      Array.from(container.querySelectorAll("time")).map((node) =>
        node.getAttribute("datetime"),
      ),
    ).toEqual(["2026-08-31", "2026-07-04", "2026-06-01"]);
  });

  it("summarises each row so the list reads without opening one", () => {
    render(<BlogIndex />);
    const earlier = screen.getByRole("list", { name: "Earlier posts" });

    expect(within(earlier).getByText("What a row shows.")).toBeDefined();
    expect(within(earlier).getByText("What another row shows.")).toBeDefined();
  });
});
