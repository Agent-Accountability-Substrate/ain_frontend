import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingBoundary } from "@/components/landing-boundary";

describe("LandingBoundary", () => {
  it("states attest-don't-gate as the boundary", () => {
    render(<LandingBoundary />);

    screen.getByRole("heading", {
      level: 2,
      name: "We record what your agents did. We never decide what they may do.",
    });
    screen.getByText(/nothing in your firm stops/);
  });

  it("carries the heading and its supporting line as one block", () => {
    const { container } = render(<LandingBoundary />);

    // The supporting sentence sits beside the heading rather than under it, so
    // the section opens as a single statement instead of a stack.
    const pair = container.querySelector(".grid");
    expect(pair?.querySelector("h2")).not.toBeNull();
    expect(pair?.querySelector("p")).not.toBeNull();
  });

  it("holds one figure and nothing competing with it", () => {
    const { container } = render(<LandingBoundary />);

    expect(container.querySelectorAll("ul, ol")).toHaveLength(0);
    expect(container.querySelectorAll(".ain-delegation-diagram")).toHaveLength(
      1,
    );
  });

  it("draws the diagram on the light ground it is legible against", () => {
    const { container } = render(<LandingBoundary />);
    const figure = container.querySelector(".ain-delegation-diagram");

    // Inverted, the edges resolve to sky-mid at 1.25px dashed and all but
    // disappear. The light tokens are the readable ones.
    expect(figure?.className).not.toMatch(/ain-delegation-diagram--inverted/);
  });

  it("draws the scenario without claiming a mechanism", () => {
    const { container } = render(<LandingBoundary />);
    const figure = container.querySelector(".ain-delegation-diagram");

    const described =
      figure?.querySelector("svg")?.getAttribute("aria-label") ?? "";

    // The description states which relationships exist and, for the second
    // agent, that none does — the schema records no link between agents.
    expect(described).toMatch(/bound into one agent record/);
    expect(described).toMatch(/no relationship between them/);
    expect(described).not.toMatch(
      /countersign|narrower than parent|authority withdrawn|handed work|delegat/i,
    );
    expect(container.textContent).not.toMatch(/countersign/i);
  });
});
