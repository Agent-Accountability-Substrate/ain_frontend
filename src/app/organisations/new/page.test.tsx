import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialAccountWorkspaceState } from "@/lib/account-workspace";

const { authMock, redirectMock, loadAccountWorkspaceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  loadAccountWorkspaceMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/auth-actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/lib/registry-api", () => ({
  loadAccountWorkspace: loadAccountWorkspaceMock,
}));

import OrganisationCreationPage from "@/app/organisations/new/page";

describe("organisation creation page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadAccountWorkspaceMock.mockReset();
    loadAccountWorkspaceMock.mockResolvedValue(initialAccountWorkspaceState);
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
});
