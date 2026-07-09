import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

// The sign-in button wraps a server action; mock it so the component tree
// renders without pulling the server-only auth module into jsdom.
vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

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

  it("offers a sign-in button", () => {
    render(<HomePage />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
  });
});
