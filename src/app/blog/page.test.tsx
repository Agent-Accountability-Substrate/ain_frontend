import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { metadata, default as BlogPage } from "@/app/blog/page";
import { BLOG_DESCRIPTION, BLOG_TITLE } from "@/domains/marketing/blog-content";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

describe("BlogPage", () => {
  it("is canonical to itself and describes the section", () => {
    expect(metadata).toMatchObject({
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      alternates: { canonical: "/blog" },
      openGraph: { url: "/blog", title: BLOG_TITLE },
    });
  });

  it("reads no session and no tenant data", () => {
    render(<BlogPage />);

    // Public like the landing page, and for the same reason: it renders
    // identically for a signed-in visitor and a stranger.
    expect(auth).not.toHaveBeenCalled();
  });

  it("has exactly one h1", () => {
    render(<BlogPage />);

    expect(screen.getAllByRole("heading", { level: 1 }).length).toBe(1);
  });
});
