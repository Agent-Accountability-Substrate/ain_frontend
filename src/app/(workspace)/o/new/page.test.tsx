import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

import { initialAccountWorkspaceState } from "@/domains/workspace/account-workspace";

const { authMock, redirectMock, loadWorkspaceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  loadWorkspaceMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  currentSession: authMock,
}));
vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));
vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));

import NewOrganisationPage from "@/app/(workspace)/o/new/page";

describe("new organisation page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: initialAccountWorkspaceState,
    });
  });

  it("is reachable with no organisation at all, because it is what creates one", async () => {
    // The one workspace address with no ULID in it. Someone who has just
    // signed up has no organisation to scope a path to, and this is the
    // screen they land on.
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });

    render(await NewOrganisationPage());

    expect(redirectMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/legal organisation name/i)).toBeDefined();
  });

  it("lets an unverified account reach the form", async () => {
    // Nothing writes `identity_assurance` yet — the registry holds SELECT
    // only — so every caller is `not_started`. A gate here would mean nobody
    // could ever register a company.
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });

    await NewOrganisationPage();

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders nothing while the layout shows the outage", async () => {
    // The layout above has already replaced the whole frame, so anything this
    // produced would be discarded. It returns rather than throws because Next
    // runs the two in parallel.
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    expect(await NewOrganisationPage()).toBeNull();
  });
});
