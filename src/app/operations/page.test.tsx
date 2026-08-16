import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";

const {
  authMock,
  redirectMock,
  loadWorkspaceMock,
  listReviewQueueMock,
  checkRegistrationMock,
  RegistryUnavailableError,
} = vi.hoisted(() => {
  class RegistryUnavailableError extends Error {
    readonly detail: string | undefined;
    constructor(message: string, options?: { detail?: string }) {
      super(message);
      this.detail = options?.detail;
    }
  }
  return {
    authMock: vi.fn(),
    redirectMock: vi.fn(),
    loadWorkspaceMock: vi.fn(),
    listReviewQueueMock: vi.fn(),
    checkRegistrationMock: vi.fn(),
    RegistryUnavailableError,
  };
});

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));
vi.mock("@/lib/auth-actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/lib/workspace-page", () => ({ loadWorkspace: loadWorkspaceMock }));
vi.mock("@/lib/operations-actions", () => ({ recordDecisionAction: vi.fn() }));
vi.mock("@/lib/registry-api", () => ({
  listReviewQueue: listReviewQueueMock,
  checkRegistration: checkRegistrationMock,
  NotAuthenticatedError: class extends Error {},
  RegistryRefusedError: class extends Error {},
  RegistryUnavailableError,
}));

import OperationsPage from "@/app/operations/page";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const noSearchParams = { searchParams: Promise.resolve({}) };

function workspace(overrides: Partial<AccountWorkspaceState>) {
  return {
    status: "ready" as const,
    state: { ...initialAccountWorkspaceState, ...overrides },
  };
}

const QUEUE_ITEM = {
  organisation_id: ORG_ID,
  name: "Northwind Advisory Ltd",
  jurisdiction: "gb",
  registration_number: "04561237",
  web_url: "https://northwind.example.com",
  address: "88 Example Road, Manchester, M1 2AB",
  verification_status: "pending" as const,
  review_reason: null,
  created_at: "2026-08-16T10:00:00Z",
};

describe("operations console", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    loadWorkspaceMock.mockReset();
    listReviewQueueMock.mockReset();
    checkRegistrationMock.mockReset();
    authMock.mockResolvedValue({ user: { email: "ops@example.com" } });
    loadWorkspaceMock.mockResolvedValue(workspace({ isOperator: true }));
    listReviewQueueMock.mockResolvedValue([QUEUE_ITEM]);
    checkRegistrationMock.mockResolvedValue({
      registration_number: "04561237",
      jurisdiction: "gb",
      claimed_name: "Northwind Advisory Ltd",
      claimed_address: "88 Example Road, Manchester, M1 2AB",
      register: {
        company_name: "NORTHWIND ADVISORY LIMITED",
        company_status: "active",
        company_type: "ltd",
        date_of_creation: "2014-03-01",
        registered_office_address: "88 Example Road, Manchester, M1 2AB",
      },
      name_matches: true,
      is_active: true,
    });
  });

  it("turns away a caller who is not an operator", async () => {
    // Presentation hides the entry and the registry answers 403 regardless;
    // this is the middle layer, so a stale link lands somewhere useful.
    loadWorkspaceMock.mockResolvedValue(workspace({ isOperator: false }));
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(OperationsPage(noSearchParams)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
    // And it never asked for other companies' data on the way.
    expect(listReviewQueueMock).not.toHaveBeenCalled();
  });

  it("redirects anonymous requests before anything else", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(OperationsPage(noSearchParams)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(redirectMock).toHaveBeenCalledWith("/");
    expect(loadWorkspaceMock).not.toHaveBeenCalled();
  });

  it("lists the queue without opening any company", async () => {
    render(await OperationsPage(noSearchParams));

    expect(screen.getByText("Northwind Advisory Ltd")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Choose a company to review" }),
    ).toBeDefined();
    // The register is only consulted for the company actually being reviewed.
    expect(checkRegistrationMock).not.toHaveBeenCalled();
  });

  it("shows both sides of the comparison for the selected company", async () => {
    render(
      await OperationsPage({ searchParams: Promise.resolve({ org: ORG_ID }) }),
    );

    // Twice on purpose: once in the queue, once as the heading of the company
    // being reviewed. The claimed name and the register's sit side by side —
    // that comparison is the whole screen.
    expect(
      screen.getByRole("heading", { name: "Northwind Advisory Ltd" }),
    ).toBeDefined();
    expect(screen.getByText("NORTHWIND ADVISORY LIMITED")).toBeDefined();
    // Never phrased as a verdict — the register cannot answer the question the
    // gate actually turns on.
    expect(
      screen.getByText(/whether the applicant may act for the company/i),
    ).toBeDefined();
  });

  it("says so when the register has no such company", async () => {
    checkRegistrationMock.mockResolvedValue({
      registration_number: "04561237",
      jurisdiction: "gb",
      claimed_name: "Northwind Advisory Ltd",
      claimed_address: "88 Example Road",
      register: null,
      name_matches: null,
      is_active: null,
    });

    render(
      await OperationsPage({ searchParams: Promise.resolve({ org: ORG_ID }) }),
    );

    expect(screen.getByText(/has no company with this number/i)).toBeDefined();
  });

  it("still lets the operator decide when the register is unreachable", async () => {
    // The lookup is advisory, so its failure must not take the queue with it.
    checkRegistrationMock.mockRejectedValue(
      new RegistryUnavailableError("boom", {
        detail: "companies house lookup is not configured",
      }),
    );

    render(
      await OperationsPage({ searchParams: Promise.resolve({ org: ORG_ID }) }),
    );

    expect(
      screen.getByText(/companies house lookup is not configured/i),
    ).toBeDefined();
    expect(screen.getByText(/Look the number up by hand/i)).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "What did you find?" }),
    ).toBeDefined();
  });

  it("ignores a company id that is not in the queue", async () => {
    // Decided organisations leave the queue, so a stale link must not reopen
    // one for a second decision the registry would refuse anyway.
    render(
      await OperationsPage({
        searchParams: Promise.resolve({
          org: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Choose a company to review" }),
    ).toBeDefined();
    expect(checkRegistrationMock).not.toHaveBeenCalled();
  });
});
