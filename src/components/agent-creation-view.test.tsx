import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentCreationView } from "@/components/agent-creation-view";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("AgentCreationView", () => {
  it("keeps the direct agent route honest without an organisation", () => {
    render(<AgentCreationView email="owner@example.com" />);

    expect(
      screen.getByRole("heading", { name: "Select an organisation first" }),
    ).toBeDefined();
    expect(
      screen.getAllByRole("link", { name: "Choose organisation" }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("heading", {
        name: "Choose an organisation to continue",
      }),
    ).toBeDefined();

    // With no organisation there must be no submittable agent form at all.
    expect(screen.queryByLabelText("Agent name")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /prepare agent record/i }),
    ).toBeNull();
  });
});
