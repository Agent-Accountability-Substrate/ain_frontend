import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentDemoView } from "@/components/agent-demo-view";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("AgentDemoView", () => {
  it("renders the illustrative AIN accountability workspace", () => {
    render(<AgentDemoView email="user@example.com" />);

    expect(
      screen.getByRole("link", { name: "SUBRA AIN Registry home" }),
    ).toBeDefined();
    expect(screen.getByRole("img", { name: "SUBRA" })).toBeDefined();
    expect(screen.getByText("user@example.com")).toBeDefined();
    expect(
      within(screen.getByRole("contentinfo")).getByText(
        "Illustrative workspace",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", {
        name: "Agent accountability console",
      }),
    ).toBeDefined();
    expect(screen.getAllByText("Payments Operations Agent").length).toBe(2);
    expect(screen.getByText("Illustrative workspace data")).toBeDefined();
  });

  it("shows verification, scope, and linked receipt evidence", () => {
    render(<AgentDemoView email="user@example.com" />);

    expect(
      screen.getByRole("heading", {
        name: "Proposed action assessment",
      }),
    ).toBeDefined();
    expect(screen.getByText("Identity record authentic")).toBeDefined();
    expect(screen.getByText("Signing key acceptable")).toBeDefined();
    expect(screen.getAllByText("payments.initiate").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Sequence 43").length).toBeGreaterThan(1);
  });

  it("uses account navigation at the top and agent sections in the side rail", () => {
    render(<AgentDemoView email="user@example.com" />);

    const navigation = screen.getByRole("navigation", {
      name: "Account sections",
    });

    expect(
      within(navigation).getByRole("link", { name: "Overview" }),
    ).toHaveProperty("href", "http://localhost:3000/dashboard");
    expect(
      within(navigation).getByRole("link", { name: "Organisations" }),
    ).toBeDefined();
    expect(
      within(navigation).getByRole("link", {
        name: "Account & Security",
      }),
    ).toBeDefined();

    const agentNavigation = screen.getByRole("navigation", {
      name: "Agent record sections",
    });

    [
      "Agent Overview",
      "Identity and AIN Document",
      "Authorised Scope",
      "Accountable Owner",
      "Version History",
      "Lifecycle History",
      "Action Receipts",
      "Evidence Packs",
      "Public Resolver Link",
    ].forEach((label) => {
      expect(
        within(agentNavigation).getByRole("link", { name: label }),
      ).toBeDefined();
    });
  });

  it("falls back to 'unknown' when no email is present", () => {
    render(<AgentDemoView email={undefined} />);

    expect(screen.getByText("unknown")).toBeDefined();
  });

  it("offers notifications and the original account dropdown", () => {
    render(<AgentDemoView email="user@example.com" />);

    expect(screen.getByLabelText("Open notifications")).toBeDefined();
    expect(screen.getByText("You are up to date")).toBeDefined();
    expect(
      screen.getByLabelText("Open account menu for user@example.com"),
    ).toBeDefined();
    expect(screen.getByText("Profile & account management")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDefined();
  });
});
