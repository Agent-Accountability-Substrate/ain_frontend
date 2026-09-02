import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentDemoView } from "@/domains/agents/agent-demo-view";

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("AgentDemoView", () => {
  it("renders the illustrative AIN accountability workspace", () => {
    render(<AgentDemoView email="user@example.com" />);

    screen.getByRole("link", { name: "Subra AIN Registry home" });
    screen.getByRole("img", { name: "Subra" });
    screen.getByText("user@example.com");
    within(screen.getByRole("contentinfo")).getByText("Illustrative workspace");
    screen.getByRole("heading", {
      name: "Agent accountability console",
    });
    expect(screen.getAllByText("Payments Operations Agent").length).toBe(2);
    screen.getByText("Illustrative workspace data");
  });

  it("shows verification, scope, and linked receipt evidence", () => {
    render(<AgentDemoView email="user@example.com" />);

    screen.getByRole("heading", {
      name: "Proposed action assessment",
    });
    screen.getByText("Identity record authentic");
    screen.getByText("Signing key acceptable");
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
    within(navigation).getByRole("link", { name: "Organisations" });
    within(navigation).getByRole("link", {
      name: "Account & Security",
    });

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
    ].forEach((label) => {
      within(agentNavigation).getByRole("link", { name: label });
    });
  });

  it("points every record link at a section that exists on the page", () => {
    const { container } = render(<AgentDemoView email="user@example.com" />);
    const agentNavigation = screen.getByRole("navigation", {
      name: "Agent record sections",
    });

    const targets = [...agentNavigation.querySelectorAll("a")].map((link) =>
      link.getAttribute("href"),
    );
    expect(targets.length).toBeGreaterThan(0);

    // An entry whose target was deleted navigates away silently rather than
    // erroring, so nothing surfaces it but a check like this one.
    for (const href of targets) {
      expect(href).toMatch(/^#/);
      expect(
        container.querySelector(`[id="${href!.slice(1)}"]`),
      ).not.toBeNull();
    }
  });

  it("falls back to 'unknown' when no email is present", () => {
    render(<AgentDemoView email={undefined} />);

    screen.getByText("unknown");
  });

  it("offers notifications and the account menu", () => {
    render(<AgentDemoView email="user@example.com" />);

    // Both popups mount on open rather than sitting hidden in the document, so
    // each is opened before its contents are looked for.
    fireEvent.click(
      screen.getByRole("button", { name: "Notifications, none unread" }),
    );
    screen.getByText("You are up to date");

    fireEvent.click(
      screen.getByRole("button", { name: "user@example.com, account menu" }),
    );
    screen.getByText("Profile & account management");
    screen.getByRole("menuitem", { name: "Sign out" });
  });
});
