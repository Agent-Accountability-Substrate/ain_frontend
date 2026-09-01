import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  findPost,
  formatPublishedDate,
  listPosts,
} from "@/domains/marketing/blog-content";
import { BlogPostPage } from "@/domains/marketing/blog-post";

// `blog-content.test.ts` holds the list non-empty. `listPosts` carries no body,
// so the page's own post is loaded through `findPost`.
const published = await listPosts();
const post = (await findPost(published[0]!.slug))!;

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

    // Sectioned, and every section named: a body that failed to compile is an
    // article with an h1 above it and nothing under it. Named rather than
    // listed, because pinning the titles here means publishing anything newer
    // reddens this file, and `posts/README.md` promises the opposite.
    const headings = within(article)
      .getAllByRole("heading", { level: 2 })
      .map((node) => node.textContent);

    expect(headings.length).toBeGreaterThan(1);
    for (const heading of headings) expect(heading?.trim()).not.toBe("");
  });

  it("names the article after the title the layout puts above it", () => {
    const { container } = render(<BlogPostPage post={post} />);
    const article = container.querySelector("article")!;

    // The h1 paints on the dark stage, which is a different element, so the
    // article carries no heading of its own. Unnamed, the landmark a screen
    // reader lands on says nothing about which post it is.
    const labelledBy = article.getAttribute("aria-labelledby")!;
    expect(container.querySelector(`[id="${labelledBy}"]`)!.textContent).toBe(
      post.title,
    );
  });

  it("renders the body through the site's own component map", () => {
    const { container } = render(<BlogPostPage post={post} />);
    const article = container.querySelector("article")!;

    // The map reaches a post through `providerImportSource`, which the build
    // sets and nothing in the page passes by hand. The fixture is rendered
    // with the map as a prop, so only a real post exercises that wiring.
    // `h2 + p` is the body's first paragraph, not the standfirst, which the
    // page styles directly and would pass whether the map ran or not.
    expect(article.querySelector("h2")!.className).toContain("text-site-ink");
    expect(article.querySelector("h2 + p")!.className).toContain("text-[19px]");
  });

  it("anchors every section, uniquely, in every post", async () => {
    // Every post, not just the newest: a collision in an older piece is
    // permanent and goes quiet the moment anything is published after it.
    for (const summary of published) {
      const { container, unmount } = render(
        <BlogPostPage post={(await findPost(summary.slug))!} />,
      );
      const ids = Array.from(
        container.querySelectorAll("article h2, article h3"),
      ).map((node) => node.id);

      // A slug is derived from the heading's text, so two headings differing
      // only in punctuation collide and the anchor always lands on the first.
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(id).not.toBe("");
      expect(new Set(ids).size).toBe(ids.length);
      unmount();
    }
  });

  it("numbers nothing", () => {
    render(<BlogPostPage post={post} />);

    // The legal notices number their sections so a clause can be cited.
    // Nobody cites section four of an essay.
    for (const heading of screen.getAllByRole("heading", { level: 2 })) {
      expect(heading.textContent).not.toMatch(/^\d/);
    }
  });

  it("dates the post in a form a machine can read", () => {
    const { container } = render(<BlogPostPage post={post} />);
    const time = container.querySelector("time")!;

    // `datetime` is what a machine parses, the text is what a reader sees, and
    // the second is the first put through the site's own formatter — spelling
    // the date out here would redden this file the day anything newer ships.
    expect(time.getAttribute("datetime")).toBe(post.publishedAt);
    expect(time.textContent).toBe(formatPublishedDate(post.publishedAt));
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

  it("asks for access where the reader finished", () => {
    render(<BlogPostPage post={post} />);

    // The same form as the landing page, so a request from here carries the
    // same fields and is not a shape the preview team has to chase.
    const form = screen.getByRole("form", { name: "Private preview request" });
    for (const label of ["Name", "Work email", "Organisation", "Role"]) {
      expect(
        within(form).getByLabelText(label, { exact: false }),
      ).toBeDefined();
    }

    expect(
      screen
        .getAllByRole("link", { name: "partner@subrahq.com" })[0]!
        .getAttribute("href"),
    ).toBe("mailto:partner@subrahq.com");
  });
});
