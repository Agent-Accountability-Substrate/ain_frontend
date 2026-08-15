import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingScopeDiff } from "@/components/landing-scope-diff";

/**
 * Marker and code are separate cells, so textContent runs them together as
 * `-"risk_level"`. Read them as the two columns they are.
 */
const lines = (container: HTMLElement) =>
  [...container.querySelectorAll("li")].map((li) => {
    const cells = li.querySelectorAll("span");
    return {
      sign: (cells[0]?.textContent ?? "").trim(),
      code: (cells[1]?.textContent ?? "").trim(),
    };
  });

describe("LandingScopeDiff", () => {
  it("diffs the real four-key scope object, not a plausible-looking one", () => {
    const { container } = render(<LandingScopeDiff />);
    const text = container.textContent ?? "";

    // The payload contract fixes scope as exactly {action_classes,
    // constraints, risk_level, regulatory_mappings} (DECISIONS.md:213).
    // Inventing a fifth key here would be inventing an API.
    for (const key of [
      "action_classes",
      "constraints",
      "risk_level",
      "regulatory_mappings",
    ]) {
      expect(text).toContain(key);
    }
  });

  it("shows the widening as an add, and the risk change as a replace", () => {
    const { container } = render(<LandingScopeDiff />);
    const rows = lines(container);

    expect(rows).toContainEqual({ sign: "+", code: '"payments.initiate"' });
    expect(rows).toContainEqual({ sign: "-", code: '"risk_level": "medium",' });
    expect(rows).toContainEqual({ sign: "+", code: '"risk_level": "high",' });
  });

  it("carries the +/- as real characters, not colour alone", () => {
    const { container } = render(<LandingScopeDiff />);
    const rows = lines(container);

    // Colour is the redundant channel here. Someone reading this in a screen
    // reader, a printout, or with a colour-vision deficiency gets the same
    // diff, because the markers are text in the DOM.
    expect(rows.filter((row) => row.sign === "+").length).toBeGreaterThan(0);
    expect(rows.filter((row) => row.sign === "-").length).toBeGreaterThan(0);
  });

  it("states the outcome, and stays still while doing it", () => {
    const { container } = render(<LandingScopeDiff />);

    // The diff already proves the heading. Animating it only restated the
    // caption's sentence about v8, on a page that already carries two looping
    // figures — so this one is deliberately static.
    expect(container.textContent).toContain("Signed · v9 in force");
    expect(container.querySelector("[data-sign-bar]")).toBeNull();
    expect(container.querySelectorAll("[data-sign-state]")).toHaveLength(0);
  });

  it("states which version is in force until the new one is issued", () => {
    const { container } = render(<LandingScopeDiff />);
    const caption = container.querySelector("figcaption")?.textContent ?? "";

    // architecture.md:125 — supersede is transactional, and the current
    // document is the row with valid_to IS NULL. A reader must not come away
    // thinking a drafted v9 is already the authority.
    expect(caption.replace(/\s+/g, " ")).toContain(
      "Until v9 is signed and issued, v8 remains the scope in force.",
    );
    expect(caption).toMatch(/^Illustrative diff\./);
  });
});
