import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteBackHeader } from "@/domains/marketing/site-back-header";

describe("SiteBackHeader", () => {
  it("takes the wordmark home and the back link where it is told", () => {
    render(<SiteBackHeader backHref="/blog" backLabel="All insights" />);

    expect(
      screen.getByRole("link", { name: "Subra home" }).getAttribute("href"),
    ).toBe("/");
    expect(
      screen.getByRole("link", { name: "All insights" }).getAttribute("href"),
    ).toBe("/blog");
  });

  it("serves the legal notices and the blog from the same bar", () => {
    const { container } = render(
      <SiteBackHeader backHref="/" backLabel="Return to Subra" />,
    );

    expect(
      screen
        .getByRole("link", { name: "Return to Subra" })
        .getAttribute("href"),
    ).toBe("/");
    expect(container.textContent).not.toContain("—");
  });

  it("carries a colour of its own on ink, so the wordmark stays legible", () => {
    // The wordmark's product label and its divider are `currentColor`, which
    // `variant="white"` does not touch. The blog's `<main>` sets
    // `text-site-ink`, the same value as the stage behind this bar, so without
    // a colour here both paint invisibly.
    const { container } = render(
      <SiteBackHeader tone="ink" backHref="/" backLabel="Return to Subra" />,
    );

    expect(container.querySelector("header")!.className).toContain(
      "text-site-cream",
    );
  });

  it("rules itself off from the page on paper, and not on ink", () => {
    // The legal notices are paper the whole way down, so the bar needs an edge
    // to sit against. The blog's stage supplies its own.
    const paper = render(
      <SiteBackHeader backHref="/" backLabel="Return to Subra" />,
    );
    expect(paper.container.querySelector("header")!.className).toContain(
      "border-b",
    );
    paper.unmount();

    const ink = render(
      <SiteBackHeader tone="ink" backHref="/" backLabel="Return to Subra" />,
    );
    expect(ink.container.querySelector("header")!.className).not.toContain(
      "border-b",
    );
  });
});
