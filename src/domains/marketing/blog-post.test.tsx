import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { listPosts } from "@/domains/marketing/blog-content";
import { BlogPostPage } from "@/domains/marketing/blog-post";

// `blog-content.test.ts` holds the list non-empty.
const post = (await listPosts())[0]!;

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

    // Asserted against the text rather than a count: a body that failed to
    // compile would still be an article with an h1 in it.
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

  it("anchors every section, uniquely", () => {
    const { container } = render(<BlogPostPage post={post} />);
    const ids = Array.from(
      container.querySelectorAll("article h2, article h3"),
    ).map((node) => node.id);

    // A slug is derived from the heading's text, so two headings differing
    // only in punctuation collide and the anchor always lands on the first.
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id).not.toBe("");
    expect(new Set(ids).size).toBe(ids.length);
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
