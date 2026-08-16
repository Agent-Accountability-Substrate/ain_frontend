import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getServerEnvMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getServerEnvMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/server-env", () => ({ getServerEnv: getServerEnvMock }));

import {
  NotAuthenticatedError,
  RegistryUnavailableError,
  whoAmI,
} from "@/lib/registry-api";

const WHOAMI = {
  subject: "auth0|abc",
  organisation_id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  roles: ["compliance"],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("registry api", () => {
  beforeEach(() => {
    authMock.mockReset();
    getServerEnvMock.mockReset();
    getServerEnvMock.mockReturnValue({ AIN_API_BASE_URL: undefined });
    authMock.mockResolvedValue({ accessToken: "tok-123" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the session's access token as a bearer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(WHOAMI));
    vi.stubGlobal("fetch", fetchMock);

    await expect(whoAmI()).resolves.toEqual(WHOAMI);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://127.0.0.1:8000/auth/whoami");
    expect(init.headers).toMatchObject({ authorization: "Bearer tok-123" });
  });

  it("never caches — authority is re-read per request by design", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(WHOAMI));
    vi.stubGlobal("fetch", fetchMock);

    await whoAmI();

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(init.cache).toBe("no-store");
  });

  it("uses the configured origin when one is set", async () => {
    getServerEnvMock.mockReturnValue({
      AIN_API_BASE_URL: "https://api.subrahq.com",
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(WHOAMI));
    vi.stubGlobal("fetch", fetchMock);

    await whoAmI();

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.toString()).toBe("https://api.subrahq.com/auth/whoami");
  });

  it("refuses to call the registry without a token", async () => {
    authMock.mockResolvedValue({});
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(whoAmI()).rejects.toBeInstanceOf(NotAuthenticatedError);
    // The point is that nothing is sent: a tokenless request would 401 and
    // read as a permissions problem rather than a missing session.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats an expired-token session as unauthenticated", async () => {
    // The session callback drops an expired token, so the DAL sees it absent.
    authMock.mockResolvedValue({ accessToken: undefined });
    vi.stubGlobal("fetch", vi.fn());

    await expect(whoAmI()).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("maps a 401 back to re-authentication, not to a failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(whoAmI()).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("keeps a transport failure distinct from an authorisation outcome", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    await expect(whoAmI()).rejects.toBeInstanceOf(RegistryUnavailableError);
  });

  it("surfaces a non-ok status rather than parsing it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));

    await expect(whoAmI()).rejects.toBeInstanceOf(RegistryUnavailableError);
  });

  it("rejects a response whose shape drifted from the contract", async () => {
    // organisation_id is not a uuid: the backend is trusted for correctness,
    // not for shape, so drift fails loudly here instead of rendering as
    // undefined somewhere down the page.
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ ...WHOAMI, organisation_id: "x" })),
    );

    await expect(whoAmI()).rejects.toThrow();
  });
});
