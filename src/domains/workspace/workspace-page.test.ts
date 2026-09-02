import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  loadAccountWorkspaceMock,
  redirectMock,
  NotAuthenticatedError,
  RegistryUnavailableError,
} = vi.hoisted(() => {
  class NotAuthenticatedError extends Error {}
  class RegistryUnavailableError extends Error {
    readonly detail: string | undefined;
    constructor(message: string, options?: { detail?: string }) {
      super(message);
      this.detail = options?.detail;
    }
  }
  return {
    loadAccountWorkspaceMock: vi.fn(),
    redirectMock: vi.fn(),
    NotAuthenticatedError,
    RegistryUnavailableError,
  };
});

vi.mock("@/lib/registry/registry-api", () => ({
  loadAccountWorkspace: loadAccountWorkspaceMock,
  NotAuthenticatedError,
  RegistryUnavailableError,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { loadWorkspace } from "@/domains/workspace/workspace-page";

describe("loadWorkspace", () => {
  beforeEach(() => {
    loadAccountWorkspaceMock.mockReset();
    redirectMock.mockReset();
  });

  it("passes the selected organisation through", async () => {
    loadAccountWorkspaceMock.mockResolvedValue({ organisations: [] });

    await loadWorkspace("an-organisation-id");

    expect(loadAccountWorkspaceMock).toHaveBeenCalledWith("an-organisation-id");
  });

  it("sends an expired access token back to sign in, not to an error page", async () => {
    // The session cookie outlives the access token, so this is ordinary rather
    // than exceptional — and it used to render Next's server-error screen,
    // which offers no way back.
    loadAccountWorkspaceMock.mockRejectedValue(new NotAuthenticatedError());
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(loadWorkspace()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/api/auth/signin");
  });

  it("reports an unreachable registry as a state, not as a crash", async () => {
    loadAccountWorkspaceMock.mockRejectedValue(
      new RegistryUnavailableError("could not reach the registry: /orgs"),
    );

    const result = await loadWorkspace();

    expect(result.status).toBe("unavailable");
    // Never the internal message: it names our own infrastructure and the path
    // that failed, neither of which is the reader's business.
    expect(JSON.stringify(result)).not.toContain("/orgs");
  });

  it("prefers the registry's explanation when it named one", async () => {
    loadAccountWorkspaceMock.mockRejectedValue(
      new RegistryUnavailableError("registry answered 503", {
        detail: "organisation storage is not configured",
      }),
    );

    await expect(loadWorkspace()).resolves.toEqual({
      status: "unavailable",
      detail: "organisation storage is not configured",
    });
  });

  it("lets an unrecognised failure reach the error boundary", async () => {
    // The boundary exists for exactly this: something nobody anticipated
    // should not be quietly rendered as "the registry is down".
    loadAccountWorkspaceMock.mockRejectedValue(new TypeError("undefined.map"));

    await expect(loadWorkspace()).rejects.toBeInstanceOf(TypeError);
  });
});
