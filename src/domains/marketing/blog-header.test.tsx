import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BlogHeader } from "@/domains/marketing/blog-header";

describe("BlogHeader", () => {
  it("takes the wordmark home and the back link where it is told", () => {
    render(<BlogHeader backHref="/blog" backLabel="All insights" />);

    expect(
      screen.getByRole("link", { name: "Subra home" }).getAttribute("href"),
    ).toBe("/");
    expect(
      screen.getByRole("link", { name: "All insights" }).getAttribute("href"),
    ).toBe("/blog");
  });

  it("serves the index and a post from the same bar", () => {
    const { container } = render(
      <BlogHeader backHref="/" backLabel="Return to Subra" />,
    );

    expect(
      screen
        .getByRole("link", { name: "Return to Subra" })
        .getAttribute("href"),
    ).toBe("/");
    expect(container.textContent).not.toContain("—");
  });
});
