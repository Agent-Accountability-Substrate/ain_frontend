import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, getServerEnvMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getServerEnvMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  currentSession: authMock,
}));
vi.mock("@/lib/config/server-env", () => ({ getServerEnv: getServerEnvMock }));

import {
  createOrganisation,
  identityAssurance,
  inviteMember,
  leaveOrganisation,
  getAgent,
  listMembers,
  listReviewQueue,
  recordVerification,
  submitAgent,
  transitionAgent,
  listAgents,
  listOrganisations,
  loadAccountWorkspace,
  NotAuthenticatedError,
  RegistryUnavailableError,
  whoAmI,
} from "@/lib/registry/registry-api";

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

  it("keeps a base URL's own path prefix", async () => {
    // `new URL("/auth/whoami", "https://host/registry")` drops "/registry",
    // because an absolute path replaces the base's. A registry behind a
    // gateway would 404 every call while still forwarding the bearer token to
    // a path nobody meant, and nothing would complain at boot.
    getServerEnvMock.mockReturnValue({
      AIN_API_BASE_URL: "https://api.subrahq.com/registry",
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(WHOAMI));
    vi.stubGlobal("fetch", fetchMock);

    await whoAmI();

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.toString()).toBe("https://api.subrahq.com/registry/auth/whoami");
  });

  it("does not double the separator on a base URL that ends in one", async () => {
    getServerEnvMock.mockReturnValue({
      AIN_API_BASE_URL: "https://api.subrahq.com/registry/",
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(WHOAMI));
    vi.stubGlobal("fetch", fetchMock);

    await whoAmI();

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.toString()).toBe("https://api.subrahq.com/registry/auth/whoami");
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
      // Its own ULID, because that is what addresses it: two organisations
      // sharing one would be two organisations at one URL.
      org_ulid: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
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
        ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        name: "Acme Ltd",
        membershipRole: "owner",
        verificationStatus: "verified",
      },
      {
        id: second.organisation_id,
        ulid: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
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

describe("registry writes", () => {
  it("sends the field names the registry expects when creating a company", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        organisation_id: ORG_ID,
        org_ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        verification_status: "pending",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createOrganisation({
      name: "Acme Ltd",
      jurisdiction: "gb",
      registrationNumber: "01234567",
      address: "1 Test Street",
    });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/orgs");
    expect(init.method).toBe("POST");
    // web_url is omitted, not sent as null: it is optional and absent.
    expect(JSON.parse(String(init.body))).toEqual({
      name: "Acme Ltd",
      jurisdiction: "gb",
      registration_number: "01234567",
      address: "1 Test Street",
    });
  });

  it("omits a null reason so an approval carries none", async () => {
    // The registry refuses a reason on `verified` rather than ignoring one, so
    // sending an explicit null would be a 422 instead of an approval.
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        organisation_id: ORG_ID,
        verification_status: "verified",
        review_reason: null,
        verified_at: "2026-08-16T12:00:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await recordVerification(ORG_ID, "verified", null);

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ outcome: "verified" });
  });

  it("escapes the AIN into the submit path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ain: AGENT.ain,
        status: "active",
        document_version: 1,
        document_hash: "a".repeat(64),
        kid: "kid-1",
        chain_head: "b".repeat(64),
        resolver_url: "https://resolve.test/x",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await submitAgent(ORG_ID, AGENT.ain);

    const [url] = fetchMock.mock.calls[0] as [URL];
    // An AIN carries colons; they must survive as one path segment.
    expect(url.pathname).toContain(encodeURIComponent(AGENT.ain));
    expect(url.pathname.endsWith("/submit")).toBe(true);
  });

  it("parses the review queue and refuses a decided organisation in it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          organisations: [
            {
              organisation_id: ORG_ID,
              name: "Acme Ltd",
              jurisdiction: "gb",
              registration_number: "01234567",
              web_url: null,
              address: "1 Test Street",
              verification_status: "verified",
              review_reason: null,
              created_at: "2026-08-16T10:00:00Z",
            },
          ],
        }),
      ),
    );

    // The queue is what is *outstanding*; a decided row appearing in it is a
    // contract break worth failing on rather than rendering.
    await expect(listReviewQueue()).rejects.toThrow();
  });

  it("sends an invitation as a write, not a read", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await inviteMember(ORG_ID, "auditor@example.com", "auditor");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe(`/orgs/${ORG_ID}/members`);
    expect(init.method).toBe("POST");
  });

  it("says nobody is listed only when the registry could list them", async () => {
    // The registry has no members read yet. An empty array and "we cannot ask"
    // are different claims, and only one of them is true.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 404)));

    await expect(listMembers(ORG_ID)).resolves.toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          members: [
            {
              member_id: "1f4f4c6e-0000-4000-8000-000000000001",
              email: "auditor@example.com",
              role: "auditor",
            },
          ],
        }),
      ),
    );

    await expect(listMembers(ORG_ID)).resolves.toEqual([
      {
        id: "1f4f4c6e-0000-4000-8000-000000000001",
        email: "auditor@example.com",
        role: "auditor",
      },
    ]);
  });

  it("does not report an outage as a missing members route", async () => {
    // `null` means "the registry does not serve this yet", which the page
    // turns into "anyone already invited still has access". Said during an
    // outage that is a claim with nothing behind it.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 503)));

    await expect(listMembers(ORG_ID)).rejects.toBeInstanceOf(
      RegistryUnavailableError,
    );
  });

  it("does not report an expired session as a missing members route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(listMembers(ORG_ID)).rejects.toBeInstanceOf(
      NotAuthenticatedError,
    );
  });

  it("lets contract drift fail loudly rather than reading as unserved", async () => {
    // `member_id` renamed. The module's whole promise is that drift surfaces
    // here rather than as `undefined` rendering halfway down a page.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          members: [{ id: "1", email: "auditor@example.com", role: "auditor" }],
        }),
      ),
    );

    await expect(listMembers(ORG_ID)).rejects.toBeTruthy();
  });

  it("gives up access with a delete that expects no body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(leaveOrganisation(ORG_ID)).resolves.toBe("left");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe(`/orgs/${ORG_ID}/members/me`);
    expect(init.method).toBe("DELETE");
    // No body, so no content-type to declare one.
    expect(init.body).toBeUndefined();
  });

  it("reports a missing capability as missing, not as an outage", async () => {
    // A 404 or 405 here means the route is not there. Nothing is wrong with
    // the registry, so "try again shortly" would be advice that cannot work.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 405)));

    await expect(leaveOrganisation(ORG_ID)).resolves.toBe("unsupported");
  });

  it("reads the 422 the registry actually sends as a missing capability", async () => {
    // `/orgs/{id}/members/me` is matched by the registry's
    // `/orgs/{organisation_id}/members/{member_id}`, whose `member_id` is a
    // UUID — so the literal "me" fails validation before any handler runs and
    // FastAPI answers 422 with an array `detail`. No string survives
    // `refusalDetail`, so it arrives as an unavailability; reading it as one
    // told every non-owner to retry something that can never succeed.
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { detail: [{ loc: ["path", "member_id"], msg: "invalid uuid" }] },
            422,
          ),
        ),
    );

    await expect(leaveOrganisation(ORG_ID)).resolves.toBe("unsupported");
  });

  it("still fails an outage closed while leaving", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    await expect(leaveOrganisation(ORG_ID)).rejects.toBeInstanceOf(
      RegistryUnavailableError,
    );
  });
});

describe("the single-agent read", () => {
  const AIN =
    "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

  const RECORD = {
    ...AGENT,
    document: {
      document_version: 3,
      document_hash: "9f2c7a",
      kid: "ain-registry-2026-07",
      valid_from: "2026-07-16T12:00:00Z",
    },
    scope: {
      action_classes: ["payments.initiate"],
      constraints: { "payments.initiate": { max_value_gbp: 5000 } },
      risk_level: "high",
      regulatory_mappings: ["FCA CONC 7"],
    },
    accountability: {
      role_title: "Head of Collections",
      responsibility_area: "collections",
      regulatory_identifier: "SMF24-000123",
    },
    external_identities: [
      { ref_type: "spiffe", ref_value: "spiffe://x/y", verified: false },
    ],
    lifecycle: [
      {
        seq: 1,
        event_type: "registered",
        occurred_at: "2026-07-16T11:00:00Z",
        event_hash: "aa",
        previous_event_hash: null,
      },
    ],
    resolver_url: `https://resolver.example/${AIN}`,
  };

  it("escapes the identifier into one path segment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(RECORD));
    vi.stubGlobal("fetch", fetchMock);

    await getAgent(ORG_ID, AIN);

    const [url] = fetchMock.mock.calls[0] as [URL];
    // An AIN is opaque and byte-exact once minted, so it is escaped rather
    // than trusted to contain nothing that would split the path.
    expect(url.pathname).toBe(
      `/orgs/${ORG_ID}/agents/${encodeURIComponent(AIN)}`,
    );
  });

  it("carries the scope, the owner and the chain through", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(RECORD)));

    const record = await getAgent(ORG_ID, AIN);

    expect(record?.scope?.constraints).toEqual({
      "payments.initiate": { max_value_gbp: 5000 },
    });
    expect(record?.accountability?.regulatoryIdentifier).toBe("SMF24-000123");
    expect(record?.lifecycle[0]?.previousEventHash).toBeNull();
    expect(record?.document?.documentVersion).toBe(3);
  });

  it("drops the keys a draft has nothing for, rather than carrying nulls", async () => {
    // An absent scope and an empty one are different claims: an empty scope
    // says "authorised to do nothing".
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...RECORD,
          status: "draft",
          document: null,
          scope: null,
          accountability: null,
          lifecycle: [],
          resolver_url: null,
        }),
      ),
    );

    const record = await getAgent(ORG_ID, AIN);

    expect(record).toBeDefined();
    expect("scope" in record!).toBe(false);
    expect("document" in record!).toBe(false);
    expect("resolverUrl" in record!).toBe(false);
  });

  it("reports an agent this organisation does not have as absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 404)));

    await expect(getAgent(ORG_ID, AIN)).resolves.toBeNull();
  });

  it("treats a registry with no single-agent read as having no record", async () => {
    // `PATCH` is the only method registered on this path today, so a `GET`
    // answers 405. Nothing is wrong and retrying cannot help, so a screen that
    // merely offers the record stops offering it rather than falling over.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 405)));

    await expect(getAgent(ORG_ID, AIN)).resolves.toBeNull();
  });

  it("still fails an outage closed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    await expect(getAgent(ORG_ID, AIN)).rejects.toBeInstanceOf(
      RegistryUnavailableError,
    );
  });

  it("posts a withdrawal to its own verb sub-path, with the reason", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ain: AIN,
        status: "suspended",
        event_type: "suspended",
        seq: 3,
        chain_head: "cc",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await transitionAgent(ORG_ID, AIN, "suspend", "Model replaced");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe(
      `/orgs/${ORG_ID}/agents/${encodeURIComponent(AIN)}/suspend`,
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ reason: "Model replaced" });
  });
});
