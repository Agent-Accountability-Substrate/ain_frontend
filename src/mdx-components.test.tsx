import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Fixture from "@test/fixtures/mdx-sample.mdx";
import { headingId, useMDXComponents } from "@/mdx-components";

/**
 * The map is what stands between a post's markdown and the site's typography.
 * Vitest compiles `.mdx` without the Next loader, so a post rendered in its own
 * test emits bare tags; this is the one place the classes are checked.
 */
describe("useMDXComponents", () => {
  const components = useMDXComponents();

  it("styles the elements a post actually uses", () => {
    const { container } = render(<Fixture components={components} />);

    expect(container.querySelector("h2")!.className).toContain("font-medium");
    expect(container.querySelector("p")!.className).toContain(
      "text-site-ink-soft",
    );
    expect(container.querySelector("li")!.className).toContain("pl-7");
    expect(container.querySelector("a")!.className).toContain("underline");
    expect(container.querySelector("strong")!.className).toContain(
      "text-site-ink",
    );
    expect(container.querySelector("code")!.className).toContain(
      "font-site-mono",
    );
    expect(container.querySelector("blockquote")!.className).toContain(
      "border-site-accent",
    );
  });

  it("keeps the content the markdown declared", () => {
    const { container } = render(<Fixture components={components} />);

    // A map that dropped `children` would style everything and render nothing.
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "A heading",
    );
    expect(container.querySelector("a")!.getAttribute("href")).toBe("/privacy");
    expect(container.querySelectorAll("li").length).toBe(2);
    expect(container.textContent).toContain("First item");
  });

  it("anchors every heading so a section can be linked to", () => {
    render(<Fixture components={components} />);

    expect(screen.getByRole("heading", { level: 2 }).id).toBe("a-heading");
  });

  it("returns the same map every call", () => {
    // Next calls this per render. Rebuilding the object each time would give
    // every element a new component type and remount the whole post.
    expect(useMDXComponents()).toBe(components);
  });
});

describe("headingId", () => {
  it("slugifies plain text", () => {
    expect(headingId("Logs are not evidence")).toBe("logs-are-not-evidence");
  });

  it("drops punctuation rather than encoding it", () => {
    expect(headingId("Attest, do not gate")).toBe("attest-do-not-gate");
    expect(headingId("What's the cost?")).toBe("what-s-the-cost");
  });

  it("reads through the elements markdown wraps emphasis in", () => {
    // `## The **version** problem` arrives as an array with an element in it.
    // Stringifying that naively gives an anchor of [object Object], on exactly
    // the headings somebody bothered to emphasise.
    expect(
      headingId(["The ", <strong key="e">version</strong>, " problem"]),
    ).toBe("the-version-problem");
  });

  it("takes numbers, which JSX passes through unwrapped", () => {
    expect(headingId(["Section ", 4])).toBe("section-4");
  });

  it("ignores what has no text in it", () => {
    expect(headingId([null, undefined, false, "Live"])).toBe("live");
  });
});
