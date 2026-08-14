import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingIntegrity } from "@/components/landing-integrity";

const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

describe("LandingIntegrity", () => {
  it("leads with the guarantee rather than the gap", () => {
    render(<LandingIntegrity />);

    // The heading names the guarantee and never the missing certifications.
    // No company advertises what it lacks.
    screen.getByRole("heading", {
      level: 2,
      name: "A record you can argue with is not evidence.",
    });
    expect(screen.queryByText(/no certifications/i)).toBeNull();
  });

  it("draws the chain over the ledger that has one", () => {
    const { container } = render(<LandingIntegrity />);
    const text = container.textContent ?? "";

    // Lifecycle events carry previous_event_hash and chain by it. Document
    // versions link by a supersede pointer and carry their own hash, which is
    // a different mechanism — the figure must not conflate them.
    expect(text).toContain("AIN-LIFECYCLE-GENESIS-v1");
    expect(text).toContain("← prev");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(4);
    expect(text).not.toMatch(/document version \d+ ← prev/i);
  });

  it("states the chaining mechanism as text, not only as a drawing", () => {
    const { container } = render(<LandingIntegrity />);

    expect((container.textContent ?? "").replace(/\s+/g, " ")).toContain(
      "each entry carries the hash of the one before it",
    );
  });

  it("shows the break, and describes it rather than animating it at a reader", () => {
    const { container } = render(<LandingIntegrity />);

    const failures = container.querySelectorAll('[data-chain-state="fail"]');
    expect(failures).toHaveLength(3);

    // Genesis sits above the edit, so it never fails.
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0]?.querySelector('[data-chain-state="fail"]')).toBeNull();
    expect(rows[0]?.textContent).toContain("Verified");

    // Which verdict is visible changes several times a cycle and opacity does
    // not hide anything from a screen reader, so exposing either state told
    // one audience something the other could see was untrue. Both the cells
    // and the verdict line are out of the tree.
    for (const cell of container.querySelectorAll("tbody tr td:last-child")) {
      expect(cell.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    }
    expect(
      container
        .querySelector("[data-chain-verdict]")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");

    // What replaces them: one static description that holds whether or not
    // the loop is running, and does not contradict the screen.
    const description = container.querySelector(".sr-only");
    expect(description?.textContent).toMatch(/every entry here verifies/i);
    expect(description?.textContent).toMatch(/stop verifying/i);
  });

  it("holds one figure and nothing beside it", () => {
    const { container } = render(<LandingIntegrity />);

    expect(container.querySelectorAll("figure")).toHaveLength(1);
    expect(container.querySelectorAll("table")).toHaveLength(1);
  });

  it("keeps every paragraph under the corpus ceiling", () => {
    const { container } = render(<LandingIntegrity />);

    for (const paragraph of container.querySelectorAll("p")) {
      expect(countWords(paragraph.textContent ?? "")).toBeLessThanOrEqual(40);
    }
  });

  it("ships no vanity numerals", () => {
    const { container } = render(<LandingIntegrity />);

    expect(container.textContent).not.toMatch(/RFCs conformed to/i);
    expect(container.textContent).not.toMatch(/of records signed at issue/i);
    expect(container.textContent).not.toMatch(/private keys ever leave/i);
  });

  it("ships no dead links", () => {
    const { container } = render(<LandingIntegrity />);

    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0);
  });
});
