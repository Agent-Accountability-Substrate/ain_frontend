import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";

const { authMock, redirectMock, notFoundMock, loadWorkspaceMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    redirectMock: vi.fn(),
    notFoundMock: vi.fn(),
    loadWorkspaceMock: vi.fn(),
  }),
);

vi.mock("@/auth", () => ({
  auth: authMock,
  currentSession: authMock,
}));

// Mocked so these stay tests of the route's own behaviour — fail closed, 404 an
// organisation you are not in, render the outage — rather than of the DAL.
vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));
vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
  notFound: notFoundMock,
}));
vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

import OrganisationRegistrationPage from "@/app/(workspace)/o/[org]/settings/registration/page";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";

const MEMBER: AccountWorkspaceState = {
  ...initialAccountWorkspaceState,
  organisations: [
    {
      id: ORG_ID,
      ulid: ULID,
      name: "Example Holdings Ltd",
      membershipRole: "owner",
      verificationStatus: "verified",
    },
  ],
  selectedOrganisationId: ORG_ID,
};

const params = (org: string) => ({ params: Promise.resolve({ org }) });

describe("organisation registration page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    notFoundMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({ status: "ready", state: MEMBER });
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });
  });

  it("shows what the registry holds about the organisation in the path", async () => {
    render(await OrganisationRegistrationPage(params(ULID)));

    expect(loadWorkspaceMock).toHaveBeenCalledWith(ULID);
    expect(screen.getByRole("heading", { name: "Registration" })).toBeDefined();
    expect(screen.getAllByText(ULID).length).toBeGreaterThan(0);
  });

  it("is a 404 for an organisation this account is not in", async () => {
    // Indistinguishable from one that does not exist, on purpose: the ULID
    // resolves against the caller's own memberships, so there is no separate
    // authorisation branch and nothing to leak by getting it wrong.
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: { ...MEMBER, namedOrganisationFound: false },
    });
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      OrganisationRegistrationPage(params("01BX5ZZKBKACTAV9WEVGEMMVRZ")),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders nothing while the layout shows the outage", async () => {
    // The layout above has already replaced the whole frame, so anything this
    // produced would be discarded. It returns rather than throws because Next
    // runs the two in parallel.
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    expect(await OrganisationRegistrationPage(params(ULID))).toBeNull();
  });
});
