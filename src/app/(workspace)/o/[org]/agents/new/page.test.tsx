import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";

const {
  authMock,
  redirectMock,
  notFoundMock,
  loadWorkspaceMock,
  getAgentMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  notFoundMock: vi.fn(),
  loadWorkspaceMock: vi.fn(),
  getAgentMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  currentSession: authMock,
}));
vi.mock("@/domains/workspace/workspace-page", () => ({
  loadWorkspace: loadWorkspaceMock,
}));
vi.mock("@/lib/registry/registry-api", () => ({ getAgent: getAgentMock }));
vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
  notFound: notFoundMock,
}));
vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

import AgentCreationPage from "@/app/(workspace)/o/[org]/agents/new/page";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = `did:ain:gb:${ULID}:01BX5ZZKBKACTAV9WEVGEMMVRZ`;

const workspace: AccountWorkspaceState = {
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
  agents: [
    {
      ain: `did:ain:gb:${ULID}:01J9Z3K7Q2M8WXG0J8N1V6ABCD`,
      name: "Payments Operations Agent",
      role: "Initiates and reconciles supplier payments",
      status: "active",
      riskClass: "high",
      organisationId: ORG_ID,
      validFrom: "2026-07-23T10:42:00Z",
      createdAt: "2026-07-23T10:40:00Z",
    },
  ],
};

const params = (org: string, draft?: string) => ({
  params: Promise.resolve({ org }),
  searchParams: Promise.resolve(draft === undefined ? {} : { draft }),
});

describe("agent creation page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    notFoundMock.mockReset();
    loadWorkspaceMock.mockReset();
    getAgentMock.mockReset();
    getAgentMock.mockResolvedValue(null);
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });
    loadWorkspaceMock.mockResolvedValue({ status: "ready", state: workspace });
  });

  it("opens the wizard for the organisation in the path", async () => {
    render(await AgentCreationPage(params(ULID)));

    expect(loadWorkspaceMock).toHaveBeenCalledWith(ULID);
    expect(
      screen.getByRole("heading", { level: 1, name: "Register an agent" }),
    ).toBeDefined();
  });

  it("is a 404 for an organisation this account is not in", async () => {
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: { ...workspace, namedOrganisationFound: false },
    });
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      AgentCreationPage(params("01BX5ZZKBKACTAV9WEVGEMMVRZ")),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("resumes a draft named in the query rather than minting a second AIN", async () => {
    getAgentMock.mockResolvedValue({
      ain: AIN,
      name: "Collections Assistant",
      status: "draft",
    });

    render(await AgentCreationPage(params(ULID, AIN)));

    expect(getAgentMock).toHaveBeenCalledWith(ORG_ID, AIN);
    expect(
      screen.getByRole("heading", { level: 1, name: "Finish this agent" }),
    ).toBeDefined();
  });

  it("ignores a draft query naming an agent that is already issued", async () => {
    // Scope changes by supersede, not by re-running the declaration form.
    getAgentMock.mockResolvedValue({
      ain: AIN,
      name: "Live",
      status: "active",
    });

    render(await AgentCreationPage(params(ULID, AIN)));

    expect(
      screen.getByRole("heading", { level: 1, name: "Register an agent" }),
    ).toBeDefined();
  });

  it("renders nothing while the layout shows the outage", async () => {
    // The layout above has already replaced the whole frame, so anything this
    // produced would be discarded. It returns rather than throws because Next
    // runs the two in parallel.
    loadWorkspaceMock.mockResolvedValue({
      status: "unavailable",
      detail: "storage is temporarily unavailable",
    });

    expect(await AgentCreationPage(params(ULID))).toBeNull();
  });
});
