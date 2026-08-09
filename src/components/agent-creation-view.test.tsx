import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getAllByRole("link", { name: "Choose organisation" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Create your first agent" })).toBeDefined();

    fireEvent.change(screen.getByLabelText("Agent name"), {
      target: { value: "Payments Operations Agent" },
    });
    fireEvent.change(screen.getByLabelText("Accountable owner"), {
      target: { value: "Payments Operations" },
    });
    fireEvent.click(screen.getByRole("button", { name: /prepare agent record/i }));

    expect(screen.getByText("Your first agent is ready to review")).toBeDefined();
  });
});
