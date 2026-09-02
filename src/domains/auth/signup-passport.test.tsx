import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignupPassport } from "@/domains/auth/signup-passport";
import { EXAMPLE_AGENT_IN_FORCE } from "@/lib/brand/example-agent";

describe("SignupPassport", () => {
  it("prints the same record the landing page deals, not a second copy of it", () => {
    const { container } = render(<SignupPassport />);
    const version = EXAMPLE_AGENT_IN_FORCE;

    // One fictional agent shown on two surfaces. Typed out again here, an
    // amendment to the example scope or the accountable role would reach the
    // landing deck and leave this card quoting the old facts, with nothing
    // failing — the landing page's own test cannot see this file.
    expect(screen.getByText(version.name)).toBeDefined();
    expect(screen.getByText(version.accountable)).toBeDefined();
    expect(screen.getByText(version.ain)).toBeDefined();
    expect(screen.getByText(version.issuedOn)).toBeDefined();
    expect(container.textContent).toContain(`${version.id} · ${version.event}`);
    for (const entry of version.scope) {
      expect(screen.getByText(entry)).toBeDefined();
    }
  });

  it("wears the shared card figures rather than pasted copies of them", () => {
    const { container } = render(<SignupPassport />);

    // The masthead glyph and the orbit, both from `lib/brand`. The orbit is
    // restacked and stilled here; a redrawn glyph should still land on both
    // cards without either being edited.
    expect(container.querySelector(".pass-orbit-core")).not.toBeNull();
    expect(container.querySelectorAll(".pass-orbit-ring")).toHaveLength(2);

    // Stilled: the deck's three pulsing nodes are the deck's alone.
    expect(container.querySelectorAll(".animate-site-node")).toHaveLength(0);
  });
});
