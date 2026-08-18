import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";

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
vi.mock("@/lib/agent-actions", () => ({
  registerAgentAction: vi.fn(),
  patchAgentAction: vi.fn(),
  submitAgentAction: vi.fn(),
}));

import AgentCreationPage from "@/app/agents/new/page";

const noSearchParams = { searchParams: Promise.resolve({}) };

function workspace(
  overrides: Partial<AccountWorkspaceState>,
): AccountWorkspaceState {
  return { ...initialAccountWorkspaceState, ...overrides };
}

describe("agent creation page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: initialAccountWorkspaceState,
    });
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });
  });

  it("asks for an organisation before offering the form", async () => {
    render(await AgentCreationPage(noSearchParams));

    expect(
      screen.getByRole("heading", {
        name: "Choose an organisation to continue",
      }),
    ).toBeDefined();
    expect(screen.queryByLabelText("Agent name")).toBeNull();
  });

  it("refuses an unverified organisation before any field is filled", async () => {
    // The registry answers 403 for an agent in an unverified organisation, so
    // the wizard says so up front instead of collecting three steps of input
    // and spending it on a refusal.
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: workspace({
        organisations: [
          {
            id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
            name: "Acme Ltd",
            membershipRole: "owner",
            verificationStatus: "pending",
          },
        ],
        selectedOrganisationId: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
      }),
    });

    render(await AgentCreationPage(noSearchParams));

    expect(
      screen.getByRole("heading", { name: "Acme Ltd is not verified yet" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("Agent name")).toBeNull();
  });

  it("opens the identity step for a verified organisation", async () => {
    loadWorkspaceMock.mockResolvedValue({
      status: "ready",
      state: workspace({
        organisations: [
          {
            id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
            name: "Acme Ltd",
            membershipRole: "owner",
            verificationStatus: "verified",
          },
        ],
        selectedOrganisationId: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
      }),
    });

    render(await AgentCreationPage(noSearchParams));

    expect(screen.getByLabelText("Agent name")).toBeDefined();
    expect(screen.getByLabelText("Risk class")).toBeDefined();
    // Scope and the SMCR reference belong to step 2, after the AIN exists.
    expect(screen.queryByLabelText("SMCR reference")).toBeNull();
  });

  it("passes the organisation named in the URL to the loader", async () => {
    await AgentCreationPage({
      searchParams: Promise.resolve({ org: "an-organisation-id" }),
    });

    expect(loadWorkspaceMock).toHaveBeenCalledWith("an-organisation-id");
  });

  it("redirects anonymous requests", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(AgentCreationPage(noSearchParams)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
