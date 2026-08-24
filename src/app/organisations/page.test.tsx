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
}));

// The page now reads the registry. Mocked here so these stay tests of the
// route's own behaviour — fail closed, render the right shell — rather than
// of the DAL, which has its own.
vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));

vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

import OrganisationsPage from "@/app/organisations/page";

describe("organisations page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: initialAccountWorkspaceState,
    });
  });

  it("renders the first-organisation entry point for a signed-in user", async () => {
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });

    render(await OrganisationsPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: "No organisations yet" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Create first organisation" }),
    ).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed and redirects an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      OrganisationsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");
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

    render(await OrganisationsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("alert").textContent).toBe(
      "storage is temporarily unavailable",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
