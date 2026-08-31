import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookieMock,
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
    cookieMock: vi.fn(),
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
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieMock }),
}));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { loadWorkspace } from "@/domains/workspace/workspace-page";

describe("loadWorkspace", () => {
  beforeEach(() => {
    cookieMock.mockReset();
    cookieMock.mockReturnValue(undefined);
    loadAccountWorkspaceMock.mockReset();
    redirectMock.mockReset();
  });

  it("passes the selected organisation through", async () => {
    loadAccountWorkspaceMock.mockResolvedValue({ organisations: [] });

    await loadWorkspace("an-organisation-id");

    expect(loadAccountWorkspaceMock).toHaveBeenCalledWith(
      "an-organisation-id",
      // The remembered organisation answers a question the address already
      // answered, so it is not consulted here.
      null,
      {},
    );
  });

  it("sends an expired access token back to sign in, not to an error page", async () => {
    // The session cookie outlives the access token, so this is ordinary rather
    // than exceptional, and a server-error screen offers no way back.
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

  it("keeps the registry's own wording off the screen", async () => {
    // "organisation storage is not configured" names a subsystem the reader
    // did not cause and cannot act on. It goes to the log instead.
    loadAccountWorkspaceMock.mockRejectedValue(
      new RegistryUnavailableError("registry answered 503", {
        detail: "organisation storage is not configured",
      }),
    );

    const result = await loadWorkspace();

    expect(result.status).toBe("unavailable");
    expect(JSON.stringify(result)).not.toContain("storage is not configured");
  });

  it("lets an unrecognised failure reach the error boundary", async () => {
    // The boundary exists for exactly this: something nobody anticipated
    // should not be quietly rendered as "the registry is down".
    loadAccountWorkspaceMock.mockRejectedValue(new TypeError("undefined.map"));

    await expect(loadWorkspace()).rejects.toBeInstanceOf(TypeError);
  });

  it("falls back to the last switch when the address names nothing", async () => {
    // Read here rather than in the layout, so the frame and the screen inside
    // it are handed the same organisation and cannot disagree.
    cookieMock.mockReturnValue({ value: "01ARZ3NDEKTSV4RRFFQ69G5FAV" });
    loadAccountWorkspaceMock.mockResolvedValue({});

    await loadWorkspace(null);

    expect(loadAccountWorkspaceMock).toHaveBeenCalledWith(
      null,
      "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      {},
    );
  });

  it("passes the caller's read options through", async () => {
    // The shell renders no agent rows, so it asks for none — which is what
    // keeps every authenticated route from paying one request per
    // organisation before first byte for rows nothing on it renders.
    loadAccountWorkspaceMock.mockResolvedValue({});

    await loadWorkspace(null, { withAgents: false });

    expect(loadAccountWorkspaceMock).toHaveBeenCalledWith(null, null, {
      withAgents: false,
    });
  });
});
