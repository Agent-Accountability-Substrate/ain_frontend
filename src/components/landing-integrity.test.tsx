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

  it("shows the break, and keeps the verified state as the readable one", () => {
    const { container } = render(<LandingIntegrity />);

    // A ledger that only ever reads VERIFIED is asking to be taken at its
    // word. The failure states are a moment in the loop rather than the
    // record's condition, so they stay out of the accessibility tree.
    const failures = container.querySelectorAll('[data-chain-state="fail"]');
    expect(failures).toHaveLength(3);
    for (const node of failures) {
      expect(node.getAttribute("aria-hidden")).toBe("true");
    }

    // Genesis sits above the edit, so it never fails.
    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0]?.querySelector('[data-chain-state="fail"]')).toBeNull();
    expect(rows[0]?.textContent).toContain("Verified");
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
