import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("home page", () => {
  it("renders the AIN-Registry heading", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "AIN-Registry" }),
    ).toBeDefined();
  });

  it("shows the registry description", () => {
    render(<HomePage />);

    expect(
      screen.getByText("The accountability registry for autonomous AI agents."),
    ).toBeDefined();
  });

  it("shows the phase-0 status line", () => {
    render(<HomePage />);

    expect(screen.getByText("Phase 0 — under construction")).toBeDefined();
  });
});
