import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentDemoView } from "@/domains/agents/agent-demo-view";

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("AgentDemoView", () => {
  it("renders the illustrative AIN accountability workspace", () => {
    render(<AgentDemoView />);

    screen.getByRole("heading", {
      name: "Agent accountability console",
    });
    expect(screen.getAllByText("Payments Operations Agent").length).toBe(2);
    screen.getByText("Illustrative workspace data");
  });

  it("shows verification, scope, and linked receipt evidence", () => {
    render(<AgentDemoView />);

    screen.getByRole("heading", {
      name: "Proposed action assessment",
    });
    screen.getByText("Identity record authentic");
    screen.getByText("Signing key acceptable");
    expect(screen.getAllByText("payments.initiate").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Sequence 43").length).toBeGreaterThan(1);
  });

  it("offers agent sections in the side rail and no workspace navigation", () => {
    render(<AgentDemoView />);

    // The command bar's sections belong to an organisation, and this page is
    // not inside one — so it has none rather than borrowing another's.
    expect(
      screen.queryByRole("navigation", { name: "Account sections" }),
    ).toBeNull();

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
    const { container } = render(<AgentDemoView />);
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
});
