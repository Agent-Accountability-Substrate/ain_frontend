import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardView } from "@/domains/workspace/dashboard-view";
import { initialAccountWorkspaceState } from "@/domains/workspace/account-workspace";

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("DashboardView", () => {
  it("renders the honest account overview zero state", () => {
    render(
      <DashboardView
        email="user@example.com"
        state={initialAccountWorkspaceState}
      />,
    );

    expect(screen.getByRole("heading", { name: "Overview" })).toBeDefined();
    expect(screen.getByText("Not Started")).toBeDefined();
    expect(screen.getAllByText("0")).toHaveLength(5);

    const metrics = screen.getByRole("region", { name: "Account metrics" });
    expect(within(metrics).getAllByRole("article")).toHaveLength(6);
    expect(metrics.querySelectorAll(".account-metric-visual")).toHaveLength(6);
    expect(document.querySelector(".account-verification-alert")).toBeNull();

    for (const label of [
      "Account verification status",
      "Number of organisations owned",
      "Number of organisations joined",
      "Organisations pending verification",
      "Organisations requiring attention",
      "Total accessible agents across organisations",
    ]) {
      expect(screen.getByText(label)).toBeDefined();
    }

    expect(screen.getByText("No organisation activity yet")).toBeDefined();
    expect(
      screen.getByRole("link", {
        name: "Open illustrative agent demo",
      }),
    ).toHaveProperty("href", "http://localhost:3000/dashboard/agent-demo");
  });

  it("shows the account menu and footer organisation context", () => {
    render(<DashboardView email="user@example.com" />);

    const navigation = screen.getByRole("navigation", {
      name: "Account sections",
    });
    expect(
      within(navigation)
        .getByRole("link", { name: "Overview" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(navigation).getByRole("link", { name: "Organisations" }),
    ).toBeDefined();
    expect(
      within(navigation).getByRole("link", {
        name: "Account & Security",
      }),
    ).toBeDefined();

    const switcher = screen.getByRole("combobox", {
      name: "Organisation switcher",
    });
    const commandBar = document.querySelector(".dashboard-command-bar");
    expect(commandBar).not.toBeNull();
    expect(
      within(commandBar as HTMLElement).queryByRole("combobox", {
        name: "Organisation switcher",
      }),
    ).toBeNull();
    expect(switcher).toHaveProperty("disabled", true);
    expect(
      within(switcher).getByText("No organisation selected"),
    ).toBeDefined();
    expect(
      within(screen.getByRole("contentinfo")).getByText(
        "No organisation selected",
      ),
    ).toBeDefined();
    expect(
      within(screen.getByRole("contentinfo")).queryByText(/Signed in as/),
    ).toBeNull();
  });

  it("shows verification as the primary next action", () => {
    render(<DashboardView email="user@example.com" />);

    const nextActions = screen
      .getByRole("heading", { name: "Primary next action" })
      .closest("section")!;
    const verifyStep = within(nextActions)
      .getByText("Verify account")
      .closest("li");
    const createOrganisationStep = within(nextActions)
      .getByText("Create first organisation")
      .closest("li");
    const selectOrganisationStep = within(nextActions)
      .getByText("Select organisation")
      .closest("li");
    const createAgentStep = within(nextActions)
      .getByText("Create first agent")
      .closest("li");

    expect(verifyStep?.getAttribute("data-state")).toBe("current");
    expect(createOrganisationStep?.getAttribute("data-state")).toBe(
      "available",
    );
    expect(selectOrganisationStep?.getAttribute("data-state")).toBe(
      "available",
    );
    expect(createAgentStep?.getAttribute("data-state")).toBe("available");
    expect(
      within(verifyStep!).getByRole("link", { name: "Continue" }),
    ).toHaveProperty("href", "http://localhost:3000/onboarding/identity");
    expect(
      within(createOrganisationStep!).getByRole("link", { name: "Open" }),
    ).toHaveProperty("href", "http://localhost:3000/organisations/new");
  });
});
