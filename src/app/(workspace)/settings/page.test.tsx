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

vi.mock("@/auth", () => ({
  auth: authMock,
  currentSession: authMock,
}));

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

import SettingsPage from "@/app/(workspace)/settings/page";

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

describe("settings page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({ status: "ready", state: STATE });
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });
  });

  it("offers the account's settings and the organisation's, in one place", async () => {
    // Someone wanting to add a colleague does not know whether "members"
    // belongs to their account or to the company. Both groups are here.
    render(await SettingsPage());

    expect(screen.getByRole("heading", { name: "Settings" })).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: /Account & security/ })
        .getAttribute("href"),
    ).toBe("/settings/account");
    expect(
      screen.getByRole("link", { name: /Members/ }).getAttribute("href"),
    ).toBe(`/o/${ULID}/settings/members`);
  });

  it("offers only the account group before the first membership", async () => {
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: initialAccountWorkspaceState,
    });

    render(await SettingsPage());

    expect(screen.getByRole("link", { name: /Organisations/ })).toBeDefined();
    // There is no company to name, so the group that would be named after one
    // is absent rather than empty.
    expect(screen.queryByRole("link", { name: /Registration/ })).toBeNull();
  });

  it("renders nothing while the layout shows the outage", async () => {
    // The layout above has already replaced the whole frame, so anything this
    // produced would be discarded. It returns rather than throws because Next
    // runs the two in parallel.
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    expect(await SettingsPage()).toBeNull();
  });
});
