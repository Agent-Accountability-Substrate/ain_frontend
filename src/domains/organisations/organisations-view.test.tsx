import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/domains/organisations/organisation-actions", () => ({
  leaveOrganisationAction: vi.fn(),
}));

import { OrganisationsView } from "@/domains/organisations/organisations-view";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
  type OrganisationSummary,
} from "@/domains/workspace/account-workspace";

const ALPHA: OrganisationSummary = {
  id: "org-a",
  ulid: "01ARZ3NDXZS2YXT1QKKCNYJX3N",
  name: "Alpha Holdings Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

const BETA: OrganisationSummary = {
  id: "org-b",
  ulid: "01ARZ3ND3CHDHMDRCHHS0QAAQ6",
  name: "Beta Systems Ltd",
  membershipRole: "member",
  verificationStatus: "pending",
};

const STATE: AccountWorkspaceState = {
  ...initialAccountWorkspaceState,
  organisations: [ALPHA, BETA],
  selectedOrganisationId: ALPHA.id,
};

describe("OrganisationsView", () => {
  it("lists the organisations the account belongs to", () => {
    render(<OrganisationsView email="founder@example.com" state={STATE} />);

    expect(
      screen.getByRole("heading", { name: "2 organisations" }),
    ).toBeDefined();

    const entries = within(
      screen.getByRole("region", { name: "2 organisations" }),
    ).getAllByRole("listitem");
    expect(entries).toHaveLength(2);
    // Role and verification state are two separate readings of the same row, so
    // they are asserted separately rather than as one run-together string.
    expect(within(entries[0]!).getByText(ALPHA.name)).toBeDefined();
    expect(within(entries[0]!).getByText("Owner")).toBeDefined();
    expect(within(entries[0]!).getByText("Verified")).toBeDefined();
    expect(within(entries[1]!).getByText(BETA.name)).toBeDefined();
    expect(within(entries[1]!).getByText("Member")).toBeDefined();
    expect(within(entries[1]!).getByText("Verification pending")).toBeDefined();
  });

  it("shows each organisation's public identifier on its row", () => {
    render(<OrganisationsView email="founder@example.com" state={STATE} />);

    // The ULID is the organisation segment of every AIN this company mints, so
    // it is what gets quoted and matched. Making someone open the organisation
    // to read it is the wrong way round.
    const entries = within(
      screen.getByRole("region", { name: "2 organisations" }),
    ).getAllByRole("listitem");
    expect(within(entries[0]!).getByText(ALPHA.ulid)).toBeDefined();
    expect(within(entries[1]!).getByText(BETA.ulid)).toBeDefined();
  });

  it("does not double as a second organisation switcher", () => {
    render(<OrganisationsView email="founder@example.com" state={STATE} />);

    const entries = within(
      screen.getByRole("region", { name: "2 organisations" }),
    ).getAllByRole("listitem");
    // A row that navigated would move the whole workspace under someone who
    // clicked a settings row. The menu beside it is what acts on it.
    expect(within(entries[1]!).queryAllByRole("link")).toHaveLength(0);
    expect(
      within(entries[1]!).getByRole("button", {
        name: `Actions for ${BETA.name}`,
      }),
    ).toBeDefined();
  });

  it("keeps the account's totals above the list", () => {
    render(<OrganisationsView email="founder@example.com" state={STATE} />);

    const metrics = screen.getByRole("region", { name: "Account metrics" });
    expect(within(metrics).getByText("Organisations owned")).toBeDefined();
    expect(within(metrics).getByText("Requiring attention")).toBeDefined();
  });
});
