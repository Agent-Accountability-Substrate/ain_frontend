import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

import { initialAccountWorkspaceState } from "@/domains/workspace/account-workspace";

const { authMock, cookieMock, redirectMock, loadWorkspaceMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    cookieMock: vi.fn(),
    redirectMock: vi.fn(),
    loadWorkspaceMock: vi.fn(),
  }),
);

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieMock }),
}));

vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));
vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));
vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

import WorkspaceLayout from "@/app/(workspace)/layout";

const ORG = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "Example Holdings Ltd",
  membershipRole: "owner" as const,
  verificationStatus: "verified" as const,
};

describe("workspace layout", () => {
  beforeEach(() => {
    authMock.mockReset();
    cookieMock.mockReset();
    cookieMock.mockReturnValue(undefined);
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: { ...initialAccountWorkspaceState, organisations: [ORG] },
    });
  });

  it("frames every screen beneath it", async () => {
    // The bar and the rail belong here rather than to a page, which is what
    // stops a navigation tearing them down and building them again.
    render(await WorkspaceLayout({ children: <p>the screen</p> }));

    expect(
      screen.getByRole("navigation", { name: "Workspace navigation" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: `${ORG.name}, switch organisation`,
      }),
    ).toBeDefined();
    expect(screen.getByText("the screen")).toBeDefined();
  });

  it("fails closed for an anonymous request, before reading anything", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      WorkspaceLayout({ children: <p>the screen</p> }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
    expect(loadWorkspaceMock).not.toHaveBeenCalled();
  });

  it("replaces the frame when the registry cannot be read", async () => {
    // Not a banner inside the shell: the shell is built from the membership
    // list, which is exactly what failed.
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    render(await WorkspaceLayout({ children: <p>the screen</p> }));

    expect(screen.getByRole("alert").textContent).toBe(
      "storage is temporarily unavailable",
    );
    expect(screen.queryByText("the screen")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
