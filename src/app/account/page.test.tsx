import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialAccountWorkspaceState } from "@/lib/account-workspace";

const { authMock, redirectMock, loadAccountWorkspaceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  loadAccountWorkspaceMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

// The page now reads the registry. Mocked here so these stay tests of the
// route's own behaviour — fail closed, render the right shell — rather than
// of the DAL, which has its own.
vi.mock("@/lib/registry-api", () => ({
  loadAccountWorkspace: loadAccountWorkspaceMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

import AccountPage from "@/app/account/page";

describe("account page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadAccountWorkspaceMock.mockReset();
    loadAccountWorkspaceMock.mockResolvedValue(initialAccountWorkspaceState);
  });

  it("renders profile and assurance as separate account facts", async () => {
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });

    render(await AccountPage());

    expect(
      screen.getByRole("heading", { name: "Account & Security" }),
    ).toBeDefined();
    expect(screen.getByText("Casey Morgan")).toBeDefined();
    expect(screen.getByText("Not Started")).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed and redirects an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(AccountPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
