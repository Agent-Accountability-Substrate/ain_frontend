import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingHowItWorks } from "@/components/landing-how-it-works";

describe("LandingHowItWorks", () => {
  it("walks register, sign, resolve", () => {
    render(<LandingHowItWorks />);

    const steps = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);

    expect(steps).toEqual([
      "Register the agent, and the human",
      "Sign it, and keep every version",
      "Ask three questions, get three answers",
    ]);
  });

  it("keeps a valid identity distinct from an authorised action", () => {
    render(<LandingHowItWorks />);

    // The resolver exists precisely so a relying party never conflates the
    // two; the page has to carry the distinction or it reads as a lookup.
    screen.getByText(
      /A valid identity is not the same answer as an authorised action/,
    );
  });
});
