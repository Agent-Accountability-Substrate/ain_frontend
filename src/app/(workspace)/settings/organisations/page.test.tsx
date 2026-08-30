import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
  type OrganisationSummary,
} from "@/domains/workspace/account-workspace";

const { authMock, redirectMock, loadWorkspaceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  loadWorkspaceMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));

// Mocked so these stay tests of the route's own behaviour — fail closed, keep
// the chrome, render the outage — rather than of the DAL.
vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));
vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));
vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/domains/organisations/organisation-actions", () => ({
  leaveOrganisationAction: vi.fn(),
}));

import OrganisationsPage from "@/app/(workspace)/settings/organisations/page";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

const MEMBER: OrganisationSummary = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ulid: ULID,
  name: "Example Holdings Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

const STATE: AccountWorkspaceState = {
  ...initialAccountWorkspaceState,
  organisations: [MEMBER],
  // Null, as the loader leaves it for an address with no organisation in it.
  // What the shell shows is resolved from the memberships instead.
  selectedOrganisationId: null,
};

describe("organisations settings page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({ status: "ready", state: STATE });
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });
  });

  it("lists the account's organisations with their identifiers", async () => {
    render(await OrganisationsPage());

    expect(
      screen.getByRole("heading", { name: "1 organisation" }),
    ).toBeDefined();
    expect(screen.getAllByText(ULID).length).toBeGreaterThan(0);
  });

  it("opens the first-organisation flow for an empty account", async () => {
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: initialAccountWorkspaceState,
    });

    render(await OrganisationsPage());

    expect(
      screen.getByRole("heading", { name: "No organisations yet" }),
    ).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: /Create first organisation/ })
        .getAttribute("href"),
    ).toBe("/o/new");
  });

  it("renders nothing while the layout shows the outage", async () => {
    // The layout above has already replaced the whole frame, so anything this
    // produced would be discarded. It returns rather than throws because Next
    // runs the two in parallel.
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    expect(await OrganisationsPage()).toBeNull();
  });
});
