import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

import { initialAccountWorkspaceState } from "@/lib/account-workspace";

const { authMock, redirectMock, loadWorkspaceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  loadWorkspaceMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));
vi.mock("@/lib/auth-actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/lib/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));

import OrganisationCreationPage from "@/app/organisations/new/page";

describe("organisation creation page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: initialAccountWorkspaceState,
    });
  });

  it("lets an unverified account reach the form", async () => {
    // The removed gate, asserted absent — and this is the one that matters.
    // This page used to redirect to /onboarding/identity unless the caller's
    // individual assurance was `verified`. Nothing writes that record: the
    // registry holds SELECT only, and which identity provider fills it is an
    // open decision. So every caller is `not_started`, and the gate would have
    // meant nobody could ever register a company.
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });

    await OrganisationCreationPage();

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects anonymous requests", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    await expect(OrganisationCreationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("renders the registry as unavailable rather than crashing", async () => {
    // The branch every page carries and nothing exercised: an outage keeps the
    // shell, its navigation and sign-out, instead of a dead end.
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    render(await OrganisationCreationPage());

    expect(screen.getByRole("alert").textContent).toBe(
      "storage is temporarily unavailable",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
