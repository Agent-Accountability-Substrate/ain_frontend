import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import Fixture from "@test/fixtures/mdx-sample.mdx";
import { headingId, useMDXComponents } from "@/mdx-components";

/**
 * One entry of the map, called directly. Some decisions are invisible in the
 * DOM — `next/link` and `<a>` both render an anchor, an omitted `id` and an
 * empty one both read as absent — so the element it returns is the assertion.
 */
type Renderer = (
  props: Record<string, unknown>,
) => ReactElement<{ id?: string }>;
const asRenderer = (component: unknown) => component as Renderer;

/** The fixture covers every element the map styles; a post covers the wiring. */
describe("useMDXComponents", () => {
  const components = useMDXComponents();

  it("styles the elements a post actually uses", () => {
    const { container } = render(<Fixture components={components} />);

    expect(container.querySelector("h2")!.className).toContain("font-medium");
    expect(container.querySelector("h3")!.className).toContain("font-medium");
    expect(container.querySelector("p")!.className).toContain(
      "text-site-ink-soft",
    );
    expect(container.querySelector("ul")!.className).toContain("[&>li]:pl-7");
    expect(container.querySelector("ol")!.className).toContain("list-decimal");
    expect(container.querySelector("a")!.className).toContain("underline");
    expect(container.querySelector("strong")!.className).toContain(
      "text-site-ink",
    );
    expect(container.querySelector("em")!.className).toContain("italic");
    expect(container.querySelector("hr")!.className).toContain("border-t");
    expect(container.querySelector("blockquote")!.className).toContain(
      "border-site-accent",
    );
  });

  it("holds an image inside the reading column", () => {
    const { container } = render(<Fixture components={components} />);
    const image = container.querySelector("img")!;

    // Unstyled, an image runs past the 720px column and scrolls the whole page
    // sideways on a phone, and with no dimensions it shifts the article as it
    // loads. The post's own alt text has to survive the default.
    expect(image.className).toContain("max-w-full");
    expect(image.className).toContain("h-auto");
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.getAttribute("alt")).toBe("A diagram");
  });

  it("draws its bullet from the list, so an ordered one is not double-marked", () => {
    const { container } = render(<Fixture components={components} />);

    // `ol` re-enables `list-decimal`, which preflight resets. A bullet drawn
    // on a shared `li` map would render "1. •" on every numbered row. No
    // published post uses an `ol`, so this fixture is the only thing that sees
    // it.
    expect(container.querySelector("ol")!.className).not.toContain("before:");
    expect(container.querySelector("ul")!.className).toContain(
      "[&>li]:before:bg-site-accent",
    );
    for (const item of container.querySelectorAll("li")) {
      expect(item.querySelector("span")).toBeNull();
    }
  });

  it("keeps a fenced block's own class and its styling both", () => {
    const { container } = render(<Fixture components={components} />);
    const code = container.querySelector("pre > code")!;

    // Markdown puts `language-ts` on the element; spreading over the class
    // rather than merging would drop the styling entirely.
    expect(code.className).toContain("language-ts");
    expect(container.querySelector("pre")!.className).toContain(
      "overflow-x-auto",
    );
  });

  it("routes an in-site link through the client router", () => {
    const { container } = render(<Fixture components={components} />);

    // `next/link` renders an anchor, so this asserts the thing that differs:
    // a plain `<a>` to an internal route reloads the whole app shell.
    const link = container.querySelector('a[href="/privacy"]')!;
    expect(link.getAttribute("href")).toBe("/privacy");
  });

  it("leaves anything not in-site a plain anchor", () => {
    // Both render an `<a>`, so the decision is asserted on the element type.
    // An off-site URL handed to `next/link` asks the client router to navigate
    // somewhere it does not own.
    const anchor = asRenderer(components.a);

    for (const href of [
      "https://example.com",
      "//example.com",
      "mailto:partner@subrahq.com",
      "#a-heading",
      undefined,
    ]) {
      expect(anchor({ href, children: "x" }).type).toBe("a");
    }
    expect(anchor({ href: "/privacy", children: "x" }).type).not.toBe("a");
  });

  it("omits the anchor on a heading with no text to slug", () => {
    // `id=""` matches an empty fragment rather than nothing.
    for (const tag of [components.h2, components.h3]) {
      const heading = asRenderer(tag);

      expect(heading({ children: "→" }).props.id).toBeUndefined();
      expect(heading({ children: "Logs are not evidence" }).props.id).toBe(
        "logs-are-not-evidence",
      );
    }
  });

  it("keeps the content the markdown declared", () => {
    const { container } = render(<Fixture components={components} />);

    // A map that dropped `children` would style everything and render nothing.
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "A heading",
    );
    expect(container.querySelector("a")!.getAttribute("href")).toBe("/privacy");
    expect(container.querySelectorAll("ul > li").length).toBe(2);
    expect(container.querySelectorAll("ol > li").length).toBe(2);
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
    // Arrives as an array with an element in it; stringified naively that is
    // an anchor of [object Object].
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
