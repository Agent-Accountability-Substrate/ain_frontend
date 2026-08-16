import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getServerEnvMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getServerEnvMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/server-env", () => ({ getServerEnv: getServerEnvMock }));

import {
  identityAssurance,
  listAgents,
  listOrganisations,
  loadAccountWorkspace,
  NotAuthenticatedError,
  RegistryUnavailableError,
  whoAmI,
} from "@/lib/registry-api";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";

const WHOAMI = {
  subject: "auth0|abc",
  organisations: [{ organisation_id: ORG_ID, roles: ["compliance"] }],
};

const ORGANISATION = {
  organisation_id: ORG_ID,
  name: "Acme Ltd",
  jurisdiction: "gb",
  org_ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  registration_number: "12345678",
  web_url: "https://acme.example.com",
  verification_status: "verified",
  review_reason: null,
  verified_at: "2026-08-01T10:00:00Z",
  roles: ["org_admin"],
  is_owner: true,
};

const AGENT = {
  agent_id: "0f8f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ain: "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ",
  name: "Collections agent",
  role: "Collections",
  status: "active",
  risk_class: "high",
  valid_from: "2026-08-01T10:00:00Z",
  created_at: "2026-08-01T09:00:00Z",
};

const NOT_STARTED = {
  status: "not_started",
  assurance_profile: null,
  provider_reference: null,
  checked_at: null,
  expires_at: null,
  review_reason: null,
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
    // The backend is trusted for correctness, not for shape, so drift fails
    // loudly here instead of rendering as undefined somewhere down the page.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          subject: "auth0|abc",
          organisations: [{ organisation_id: "x", roles: [] }],
        }),
      ),
    );

    await expect(whoAmI()).rejects.toThrow();
  });

  it("rejects the shape this endpoint used to return", async () => {
    // The regression that motivated this test: the schema here still expected
    // a single `organisation_id` long after the backend went plural, and the
    // fixture above was stale in exactly the same way — so the suite was green
    // and the first real call would have thrown. A flat response must now fail.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          subject: "auth0|abc",
          organisation_id: ORG_ID,
          roles: ["compliance"],
        }),
      ),
    );

    await expect(whoAmI()).rejects.toThrow();
  });

  it("belonging nowhere parses as an empty list, not as an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ subject: "auth0|new", organisations: [] }),
        ),
    );

    await expect(whoAmI()).resolves.toEqual({
      subject: "auth0|new",
      organisations: [],
    });
  });

  it("keeps needs_attention and rejected distinct, not collapsed", async () => {
    // They mean opposite things: one is a live registration waiting on the
    // holder, the other is finished. An earlier plan mapped rejected onto the
    // friendlier name, which would have promised a repair no endpoint offers.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          organisations: [
            { ...ORGANISATION, verification_status: "rejected" },
            {
              ...ORGANISATION,
              organisation_id: "1a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
              verification_status: "needs_attention",
              review_reason: "Send a director's proof of address.",
            },
          ],
        }),
      ),
    );

    const listed = await listOrganisations();

    expect(listed.map((o) => o.verification_status)).toEqual([
      "rejected",
      "needs_attention",
    ]);
    expect(listed[1]!.review_reason).toBe(
      "Send a director's proof of address.",
    );
  });

  it("carries the review reason into the workspace summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: URL) => {
        if (url.pathname === "/orgs") {
          return Promise.resolve(
            jsonResponse({
              organisations: [
                {
                  ...ORGANISATION,
                  verification_status: "needs_attention",
                  review_reason: "Send a director's proof of address.",
                },
              ],
            }),
          );
        }
        if (url.pathname === "/identity/assurance") {
          return Promise.resolve(jsonResponse(NOT_STARTED));
        }
        return Promise.resolve(jsonResponse({ agents: [] }));
      }),
    );

    const state = await loadAccountWorkspace();

    expect(state.organisations[0]).toMatchObject({
      verificationStatus: "needs_attention",
      reviewReason: "Send a director's proof of address.",
    });
  });

  it("refuses a verification status the contract does not define", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          organisations: [
            { ...ORGANISATION, verification_status: "requires_input" },
          ],
        }),
      ),
    );

    await expect(listOrganisations()).rejects.toThrow();
  });

  it("escapes the organisation id into the agents path", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ agents: [AGENT] }));
    vi.stubGlobal("fetch", fetchMock);

    await listAgents("../../etc/passwd");

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/orgs/..%2F..%2Fetc%2Fpasswd/agents");
  });

  it("reports an absent assurance record as not_started", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(NOT_STARTED)),
    );

    // Absent optional fields rather than explicit nulls, matching the
    // frontend type — `checkedAt` is not present, not present-and-null.
    await expect(identityAssurance()).resolves.toEqual({
      status: "not_started",
    });
  });

  it("carries assurance detail through when there is any", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...NOT_STARTED,
          status: "verified",
          assurance_profile: "uk_gpg45_medium",
          checked_at: "2026-08-01T10:00:00Z",
        }),
      ),
    );

    await expect(identityAssurance()).resolves.toEqual({
      status: "verified",
      assuranceProfile: "uk_gpg45_medium",
      checkedAt: "2026-08-01T10:00:00Z",
    });
  });

  it("composes the workspace and counts agents across organisations", async () => {
    const second = {
      ...ORGANISATION,
      organisation_id: "1a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
      name: "Beta Ltd",
      is_owner: false,
      verification_status: "pending",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: URL) => {
        const path = url.pathname;
        if (path === "/orgs") {
          return Promise.resolve(
            jsonResponse({ organisations: [ORGANISATION, second] }),
          );
        }
        if (path === "/identity/assurance") {
          return Promise.resolve(jsonResponse(NOT_STARTED));
        }
        return Promise.resolve(
          jsonResponse({
            agents: path.includes(ORG_ID) ? [AGENT, AGENT] : [AGENT],
          }),
        );
      }),
    );

    const state = await loadAccountWorkspace();

    expect(state.totalAccessibleAgents).toBe(3);
    expect(state.organisations).toEqual([
      {
        id: ORG_ID,
        name: "Acme Ltd",
        membershipRole: "owner",
        verificationStatus: "verified",
      },
      {
        id: second.organisation_id,
        name: "Beta Ltd",
        membershipRole: "member",
        verificationStatus: "pending",
      },
    ]);
    // Two organisations and no choice made: the UI must say nothing is
    // selected rather than pick one on the caller's behalf.
    expect(state.selectedOrganisationId).toBeNull();
    // No endpoint feeds this yet, and inventing one would be worse than empty.
    expect(state.recentActivity).toEqual([]);
  });

  it("selects the only organisation, because there is nothing to choose", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: URL) => {
        if (url.pathname === "/orgs") {
          return Promise.resolve(
            jsonResponse({ organisations: [ORGANISATION] }),
          );
        }
        if (url.pathname === "/identity/assurance") {
          return Promise.resolve(jsonResponse(NOT_STARTED));
        }
        return Promise.resolve(jsonResponse({ agents: [] }));
      }),
    );

    await expect(loadAccountWorkspace()).resolves.toMatchObject({
      selectedOrganisationId: ORG_ID,
    });
  });

  it("ignores a selection the caller is not a member of", async () => {
    // The id comes from the URL, so it is caller-controlled. Membership is
    // enforced by the backend on every tenant route regardless, but echoing an
    // unknown id back into the shell would render a switcher pointing at an
    // organisation that is not in its own list.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: URL) => {
        if (url.pathname === "/orgs") {
          return Promise.resolve(
            jsonResponse({
              organisations: [
                ORGANISATION,
                {
                  ...ORGANISATION,
                  organisation_id: "1a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
                },
              ],
            }),
          );
        }
        if (url.pathname === "/identity/assurance") {
          return Promise.resolve(jsonResponse(NOT_STARTED));
        }
        return Promise.resolve(jsonResponse({ agents: [] }));
      }),
    );

    await expect(
      loadAccountWorkspace("99999999-0d3f-4c86-9a53-8c8f7a1e2b4d"),
    ).resolves.toMatchObject({ selectedOrganisationId: null });
  });

  it("does not relay a 405 as if the person could fix it", async () => {
    // Found live: pointed at a backend running older code, GET /orgs answered
    // 405 and the workspace rendered "Method Not Allowed" to the user. A
    // version skew between client and server is never theirs to act on.
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ detail: "Method Not Allowed" }, 405)),
    );

    await expect(listOrganisations()).rejects.toBeInstanceOf(
      RegistryUnavailableError,
    );
  });

  it("carries a 503 explanation rather than advising a pointless retry", async () => {
    // Also found live. "issuance signing is not configured" and "storage is
    // temporarily unavailable" are both 503, and retrying helps with exactly
    // one of them. It stays an unavailability -- the fault is ours -- but the
    // caller can now say which.
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ detail: "issuance signing is not configured" }, 503),
        ),
    );

    await expect(listOrganisations()).rejects.toMatchObject({
      detail: "issuance signing is not configured",
    });
  });

  it("keeps a 404 opaque, because on a tenant route it means not-a-member", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ detail: "agent not found" }, 404)),
    );

    const error = await listOrganisations().catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(RegistryUnavailableError);
    expect(JSON.stringify(error)).not.toContain("agent not found");
  });
});
