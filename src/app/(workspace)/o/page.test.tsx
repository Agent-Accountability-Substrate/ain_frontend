import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  initialAccountWorkspaceState,
  type OrganisationSummary,
} from "@/domains/workspace/account-workspace";

const { authMock, cookieMock, redirectMock, loadWorkspaceMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    cookieMock: vi.fn(),
    redirectMock: vi.fn(),
    loadWorkspaceMock: vi.fn(),
  }),
);

vi.mock("@/auth", () => ({
  auth: authMock,
  currentSession: authMock,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieMock }),
}));

vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import WorkspaceRootPage from "@/app/(workspace)/o/page";

const org = (ulid: string): OrganisationSummary => ({
  id: `id-${ulid}`,
  ulid,
  name: `Org ${ulid}`,
  membershipRole: "owner",
  verificationStatus: "verified",
});

const ALPHA = org("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BETA = org("01BX5ZZKBKACTAV9WEVGEMMVRZ");

const ready = (organisations: OrganisationSummary[]) => ({
  status: "ready" as const,
  state: { ...initialAccountWorkspaceState, organisations },
});

describe("workspace root", () => {
  beforeEach(() => {
    authMock.mockReset();
    cookieMock.mockReset();
    cookieMock.mockReturnValue(undefined);
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });
  });

  it("goes straight in when there is one organisation to go into", async () => {
    // Not a guess: with a single membership there is nothing to choose
    // between, so asking would be a question with one answer.
    loadWorkspaceMock.mockResolvedValue(ready([ALPHA]));

    await WorkspaceRootPage();

    expect(redirectMock).toHaveBeenCalledWith(`/o/${ALPHA.ulid}`);
  });

  it("lands inside an organisation rather than on a chooser", async () => {
    // The switcher is the first thing in the top bar, so a screen whose only
    // job is to ask which organisation you meant asks a question the bar has
    // already answered — and answers it in one click instead of two.
    loadWorkspaceMock.mockResolvedValue(ready([ALPHA, BETA]));

    await WorkspaceRootPage();

    expect(redirectMock).toHaveBeenCalledWith(`/o/${ALPHA.ulid}`);
  });

  it("offers the only thing that can be done next when there is nothing yet", async () => {
    loadWorkspaceMock.mockResolvedValue(ready([]));

    await WorkspaceRootPage();

    expect(redirectMock).toHaveBeenCalledWith("/o/new");
  });

  it("does not strand an arrival on a resolution it cannot make", async () => {
    // The registry being down means the membership list is unknown, so there
    // is no organisation to resolve to.
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    await WorkspaceRootPage();

    expect(redirectMock).toHaveBeenCalledWith("/o/new");
  });

  it("fails closed for an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(WorkspaceRootPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(loadWorkspaceMock).not.toHaveBeenCalled();
  });

  it("returns you to the organisation you were last in", async () => {
    // The loader has already resolved the last switch against the
    // memberships; this only reads what it settled on.
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: {
        ...initialAccountWorkspaceState,
        organisations: [ALPHA, BETA],
        selectedOrganisationId: BETA.id,
      },
    });

    await WorkspaceRootPage();

    expect(redirectMock).toHaveBeenCalledWith(`/o/${BETA.ulid}`);
  });
});
