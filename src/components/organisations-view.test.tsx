import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganisationsView } from "@/components/organisations-view";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("OrganisationsView", () => {
  it("opens the first-organisation flow for an empty account", () => {
    render(
      <OrganisationsView
        email="user@example.com"
        state={initialAccountWorkspaceState}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No organisations yet" }),
    ).toBeDefined();
    expect(
      screen.getByText(/Start with the organisation details/),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Create first organisation" }),
    ).toHaveProperty(
      "href",
      "http://localhost:3000/organisations/new",
    );
    const navigation = screen.getByRole("navigation", {
      name: "Account sections",
    });
    expect(
      within(navigation).getByRole("link", { name: "Organisations" }),
    ).toBeDefined();
  });

  it("shows an honest empty state for a verified account", () => {
    const verifiedState: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: { status: "verified" },
    };

    render(
      <OrganisationsView
        email="user@example.com"
        state={verifiedState}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No organisations yet" }),
    ).toBeDefined();
  });
});
