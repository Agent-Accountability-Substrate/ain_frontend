import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteWordmark } from "@/lib/brand/site-mark";

describe("SiteWordmark", () => {
  it("hides the glyph from the accessibility tree", () => {
    const { container } = render(<SiteWordmark />);

    // The wordmark beside it already carries the name; announcing both would
    // read "Subra Subra". Asserted through the wordmark because the mark is
    // module-private.
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("names the product beside the wordmark, and can drop it", () => {
    const { rerender, container } = render(<SiteWordmark />);
    expect(screen.getByText("AIN Registry")).toBeDefined();

    rerender(<SiteWordmark showProduct={false} />);
    expect(container.textContent).toBe("Subra");
  });

  it("hands the caller one handle on both halves of the product name", () => {
    render(<SiteWordmark productClassName="max-[700px]:hidden" />);

    // A surface that drops the name by viewport has to drop the divider with
    // it — the nav's burger is what the divider would otherwise crowd.
    const group = screen.getByText("AIN Registry").parentElement;
    expect(group?.className).toContain("max-[700px]:hidden");
    expect(group?.querySelectorAll("span")).toHaveLength(2);
  });

  it("draws the same square as the favicon, and in the same accent", () => {
    const { container } = render(<SiteWordmark />);
    const inline = container.querySelector("path")?.getAttribute("d") ?? "";
    const favicon = readFileSync(
      join(process.cwd(), "src/app/icon.svg"),
      "utf8",
    );

    // Two deliberate representations of one mark: this one punches the rules
    // out of a single path so `currentColor` inverts it per surface, while the
    // file paints them because a favicon needs its own ground. They cannot be
    // one file — but the square is common to both, so a rebrand that updates
    // one and forgets the other fails here.
    const square = inline.split("Z")[0] + "Z";
    expect(favicon).toContain(square);

    // The one brand colour that never inverts, stated in both.
    expect(container.innerHTML).toContain("#F0803C");
    expect(favicon).toContain("#F0803C");
  });
});
