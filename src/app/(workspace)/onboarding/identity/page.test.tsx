import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

const { authMock, redirectMock, loadWorkspaceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  loadWorkspaceMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));

import IdentityOnboardingPage from "@/app/(workspace)/onboarding/identity/page";
import { initialAccountWorkspaceState } from "@/domains/workspace/account-workspace";

describe("identity onboarding page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: initialAccountWorkspaceState,
    });
  });

  it("renders the protected onboarding view for a signed-in user", async () => {
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });

    render(await IdentityOnboardingPage());

    expect(
      screen.getByRole("heading", {
        name: "Verify the person behind the organisation",
      }),
    ).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("renders nothing rather than a hardcoded state when the registry is down", async () => {
    authMock.mockResolvedValue({ user: { email: "creator@example.com" } });
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "down",
    });

    expect(await IdentityOnboardingPage()).toBeNull();
  });

  it("fails closed and redirects an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(IdentityOnboardingPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
