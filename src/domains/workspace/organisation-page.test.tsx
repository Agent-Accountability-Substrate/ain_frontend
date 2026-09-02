import { describe, expect, it, beforeEach, vi } from "vitest";

const { authMock, notFoundMock, loadWorkspaceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  notFoundMock: vi.fn(),
  loadWorkspaceMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  currentSession: authMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));

import { loadOrganisationPage } from "@/domains/workspace/organisation-page";
import { loadAccountPage } from "@/domains/workspace/account-page";
import { initialAccountWorkspaceState } from "@/domains/workspace/account-workspace";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ORG = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ulid: ULID,
  name: "Example Holdings Ltd",
  membershipRole: "owner" as const,
  verificationStatus: "verified" as const,
};
const READY = {
  status: "ready" as const,
  state: {
    ...initialAccountWorkspaceState,
    organisations: [ORG],
    selectedOrganisationId: ORG.id,
  },
};

describe("the page preambles", () => {
  beforeEach(() => {
    authMock.mockReset();
    notFoundMock.mockReset();
    loadWorkspaceMock.mockReset();
    authMock.mockResolvedValue({
      user: { email: "owner@example.com", name: "Casey" },
    });
    loadWorkspaceMock.mockResolvedValue(READY);
  });

  it("resolves the organisation the address named", async () => {
    const page = await loadOrganisationPage(ULID);

    expect(page).toMatchObject({ status: "ready", organisation: ORG });
  });

  it("is a 404 for an organisation this account is not in", async () => {
    // Indistinguishable from one that does not exist, on purpose: the ULID
    // resolves against the caller's own memberships, so there is no separate
    // authorisation branch and nothing to leak by getting it wrong.
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: { ...READY.state, namedOrganisationFound: false },
    });
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      loadOrganisationPage("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it.each([
    ["an anonymous request", () => authMock.mockResolvedValue(null)],
    [
      "an unreadable registry",
      () =>
        loadWorkspaceMock.mockResolvedValue({
          status: "unavailable",
          detail: "down",
        }),
    ],
  ])("hands the page nothing to render for %s", async (_name, arrange) => {
    // Both are the layout's to show. The page renders nothing rather than
    // throwing, because Next runs the two in parallel.
    arrange();

    await expect(loadOrganisationPage(ULID)).resolves.toEqual({
      status: "unavailable",
    });
    await expect(loadAccountPage()).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("names no organisation for an account-level page", async () => {
    const page = await loadAccountPage();

    expect(loadWorkspaceMock).toHaveBeenCalledWith(null);
    // Only what the page uses to point at a company's own settings.
    expect(page).toMatchObject({ status: "ready", organisation: ORG });
  });
});
