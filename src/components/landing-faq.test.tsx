import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingFaq } from "@/components/landing-faq";

describe("LandingFaq", () => {
  it("answers the objections that come up before a second meeting", () => {
    render(<LandingFaq />);

    screen.getByRole("heading", { level: 2, name: "What firms ask first." });
    screen.getByText("Does the check slow the agent down?");
    screen.getByText("Is it a record or a control?");
    screen.getByText("What happens when the person in the role leaves?");
    screen.getByText("What does it hold about our customers?");
  });

  it("promises no mechanism that is still deferred", () => {
    const { container } = render(<LandingFaq />);
    const text = container.textContent ?? "";

    // SCIM provisioning and cross-boundary delegation as a verifiable
    // credential are not things a buyer could rely on today.
    expect(text).not.toMatch(/SCIM/i);
    expect(text).not.toMatch(/verifiable credential/i);
    expect(text).not.toMatch(/identity provider/i);
  });

  it("keeps the record-or-control answer on the attest side of the line", () => {
    const { container } = render(<LandingFaq />);
    const text = container.textContent ?? "";

    // The page commits to attesting and never gating, so this answer has to
    // put enforcement back in the customer's runtime rather than claim it.
    expect(text).toContain("blocking the action stays your runtime's job");
    expect(text).not.toMatch(/\bwe (block|gate|enforce|prevent)\b/i);
  });

  it("opens without JavaScript and keeps answers in the DOM when closed", () => {
    const { container } = render(<LandingFaq />);

    // Native <details> means keyboard, screen reader and find-in-page all
    // work before hydration, and a closed answer still prints.
    const details = container.querySelectorAll("details");
    expect(details.length).toBe(4);

    for (const item of details) {
      expect(item.querySelector("summary")).not.toBeNull();
      expect(item.textContent ?? "").not.toBe("");
    }
  });

  it("answers the data questions a risk function asks", () => {
    const { container } = render(<LandingFaq />);
    const text = container.textContent ?? "";

    // These two are the only posture facts not stated elsewhere on the page,
    // so this answer is where they live.
    expect(text).toContain("referenced by pointer and never ingested");
    expect(text).toContain("no other firm can read your records");
  });

  it("keeps every answer under the corpus ceiling", () => {
    const { container } = render(<LandingFaq />);

    for (const paragraph of container.querySelectorAll("p")) {
      const words = (paragraph.textContent ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
      expect(words).toBeLessThanOrEqual(40);
    }
  });
});
