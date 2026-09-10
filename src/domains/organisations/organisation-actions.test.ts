import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createOrganisationMock,
  inviteMemberMock,
  listMembersMock,
  removeMemberMock,
  revalidatePathMock,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
} = vi.hoisted(() => {
  class NotAuthenticatedError extends Error {}
  class RegistryUnavailableError extends Error {}
  class RegistryRefusedError extends Error {
    constructor(
      readonly status: number,
      readonly detail: string,
    ) {
      super(detail);
    }
  }
  return {
    createOrganisationMock: vi.fn(),
    inviteMemberMock: vi.fn(),
    listMembersMock: vi.fn(),
    removeMemberMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    NotAuthenticatedError,
    RegistryRefusedError,
    RegistryUnavailableError,
  };
});

vi.mock("@/lib/registry/registry-api", () => ({
  createOrganisation: createOrganisationMock,
  inviteMember: inviteMemberMock,
  listMembers: listMembersMock,
  removeMember: removeMemberMock,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  createOrganisationAction,
  inviteMemberAction,
  leaveOrganisationAction,
  removeMemberAction,
} from "@/domains/organisations/organisation-actions";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    name: "Example Holdings Ltd",
    registrationNumber: "01234567",
    jurisdiction: "gb",
    address: "1 Example Street, London, EC1A 1AA",
    webUrl: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("createOrganisationAction", () => {
  beforeEach(() => {
    createOrganisationMock.mockReset();
    revalidatePathMock.mockReset();
    createOrganisationMock.mockResolvedValue({
      organisation_id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
      org_ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      verification_status: "pending",
    });
  });

  it("sends the registry the field names and shapes it expects", async () => {
    await createOrganisationAction({ status: "idle" }, form());

    expect(createOrganisationMock).toHaveBeenCalledWith({
      name: "Example Holdings Ltd",
      registrationNumber: "01234567",
      jurisdiction: "gb",
      address: "1 Example Street, London, EC1A 1AA",
      webUrl: undefined,
    });
  });

  it("refreshes the pages that render the list", async () => {
    // Every workspace screen is server-rendered from the registry per request
    // and the switcher sits in the shared shell, so the whole subtree is
    // revalidated — otherwise the organisation someone just created is missing
    // from the page they land on next.
    await createOrganisationAction({ status: "idle" }, form());

    expect(revalidatePathMock).toHaveBeenCalledWith("/o", "layout");
  });

  it.each([
    ["1234567", "seven digits"],
    ["123456789", "nine digits"],
    ["S1234567", "one letter"],
    ["ABCDEFGH", "no digits"],
  ])("refuses %s (%s) without calling the registry", async (value) => {
    const state = await createOrganisationAction(
      { status: "idle" },
      form({ registrationNumber: value }),
    );

    expect(state.status).toBe("error");
    expect(createOrganisationMock).not.toHaveBeenCalled();
  });

  it("requires the address the registry stores NOT NULL", async () => {
    const state = await createOrganisationAction(
      { status: "idle" },
      form({ address: "   " }),
    );

    expect(state).toMatchObject({
      status: "error",
      errors: { address: expect.stringContaining("registered office") },
    });
  });

  it("relays a refusal in the registry's own words", async () => {
    // "company already registered" is written to be read by a person, and the
    // registry keeps it generic on purpose so a collision never confirms
    // another tenant's existence. Relaying it verbatim is right.
    createOrganisationMock.mockRejectedValue(
      new RegistryRefusedError(409, "company already registered"),
    );

    const state = await createOrganisationAction({ status: "idle" }, form());

    expect(state).toEqual({
      status: "error",
      message: "company already registered",
      errors: { registrationNumber: "company already registered" },
    });
  });

  it("never relays an unavailability, which is ours and not theirs", async () => {
    createOrganisationMock.mockRejectedValue(
      new RegistryUnavailableError("registry answered 502 for /orgs"),
    );

    const state = await createOrganisationAction({ status: "idle" }, form());

    expect(state.status).toBe("error");
    // The internal message must not surface: it names our own infrastructure
    // and tells the person nothing they can act on.
    expect(JSON.stringify(state)).not.toContain("502");
    expect(state).toMatchObject({
      message: expect.stringContaining("Nothing was submitted"),
    });
  });

  it("asks an expired session to sign in rather than reporting a failure", async () => {
    createOrganisationMock.mockRejectedValue(new NotAuthenticatedError());

    const state = await createOrganisationAction({ status: "idle" }, form());

    expect(state).toMatchObject({
      message: expect.stringContaining("Sign in again"),
    });
  });
});

describe("leaveOrganisationAction", () => {
  const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
  const MEMBER_ID = "1f4f4c6e-0000-4000-8000-000000000001";
  const EMAIL = "member@example.com";

  function leaveForm(
    organisationId: string = ORG_ID,
    email: string = EMAIL,
  ): FormData {
    const data = new FormData();
    data.set("organisationId", organisationId);
    data.set("email", email);
    return data;
  }

  beforeEach(() => {
    listMembersMock.mockReset();
    removeMemberMock.mockReset();
    revalidatePathMock.mockReset();
    listMembersMock.mockResolvedValue([
      { id: MEMBER_ID, email: EMAIL, role: "compliance", status: "active" },
    ]);
  });

  it("finds the caller's own membership and ends it by id", async () => {
    // The registry has no `/members/me`, so the caller's row has to be looked
    // up first. Posting to that alias is what could only ever be refused.
    expect(
      await leaveOrganisationAction({ status: "idle" }, leaveForm()),
    ).toEqual({ status: "left" });
    expect(removeMemberMock).toHaveBeenCalledWith(ORG_ID, MEMBER_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith("/o", "layout");
  });

  it("matches the address regardless of how it is cased", async () => {
    listMembersMock.mockResolvedValue([
      {
        id: MEMBER_ID,
        email: "Member@Example.com",
        role: "auditor",
        status: "active",
      },
    ]);

    expect(
      await leaveOrganisationAction({ status: "idle" }, leaveForm()),
    ).toEqual({ status: "left" });
    expect(removeMemberMock).toHaveBeenCalledWith(ORG_ID, MEMBER_ID);
  });

  it("names a person to ask when the registry cannot list members", async () => {
    // Without the list there is no id to remove, and nothing is wrong with the
    // registry — so "try again shortly" would be a promise nothing can keep.
    listMembersMock.mockResolvedValue(null);

    const state = await leaveOrganisationAction(
      { status: "idle" },
      leaveForm(),
    );

    expect(state.status).toBe("error");
    expect(state).toHaveProperty(
      "message",
      expect.stringContaining("can remove you from the members list"),
    );
    expect(removeMemberMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("says so when the caller is not on the list at all", async () => {
    listMembersMock.mockResolvedValue([
      {
        id: MEMBER_ID,
        email: "someone@else.example",
        role: "auditor",
        status: "active",
      },
    ]);

    const state = await leaveOrganisationAction(
      { status: "idle" },
      leaveForm(),
    );

    expect(state.status).toBe("error");
    expect(removeMemberMock).not.toHaveBeenCalled();
  });

  it("relays a refusal in the registry's own words", async () => {
    removeMemberMock.mockRejectedValue(
      new RegistryRefusedError(409, "An organisation must keep one admin."),
    );

    expect(
      await leaveOrganisationAction({ status: "idle" }, leaveForm()),
    ).toEqual({
      status: "error",
      message: "An organisation must keep one admin.",
    });
  });

  it("refuses an identifier that is not one", async () => {
    const state = await leaveOrganisationAction(
      { status: "idle" },
      leaveForm("not-a-uuid"),
    );

    expect(state.status).toBe("error");
    expect(listMembersMock).not.toHaveBeenCalled();
  });

  it("asks an expired session to sign in rather than reporting a failure", async () => {
    listMembersMock.mockRejectedValue(new NotAuthenticatedError());

    expect(
      await leaveOrganisationAction({ status: "idle" }, leaveForm()),
    ).toMatchObject({ message: expect.stringContaining("Sign in again") });
  });

  it("keeps an outage on our side of the line", async () => {
    removeMemberMock.mockRejectedValue(new RegistryUnavailableError());

    const state = await leaveOrganisationAction(
      { status: "idle" },
      leaveForm(),
    );

    expect(state.status).toBe("error");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("removeMemberAction", () => {
  const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
  const MEMBER_ID = "1f4f4c6e-0000-4000-8000-000000000001";

  function removeForm(memberId: string = MEMBER_ID): FormData {
    const data = new FormData();
    data.set("organisationId", ORG_ID);
    data.set("memberId", memberId);
    data.set("email", "auditor@example.com");
    return data;
  }

  beforeEach(() => {
    removeMemberMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("removes by id and refreshes what lists the member", async () => {
    expect(await removeMemberAction({ status: "idle" }, removeForm())).toEqual({
      status: "removed",
      email: "auditor@example.com",
    });
    expect(removeMemberMock).toHaveBeenCalledWith(ORG_ID, MEMBER_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith("/o", "layout");
  });

  it("relays the registry's refusal to remove the last admin", async () => {
    // No route grants the role back from outside, so an organisation without
    // an admin could never be administered again.
    removeMemberMock.mockRejectedValue(
      new RegistryRefusedError(
        409,
        "an organisation must keep at least one admin",
      ),
    );

    expect(await removeMemberAction({ status: "idle" }, removeForm())).toEqual({
      status: "error",
      message: "an organisation must keep at least one admin",
    });
  });

  it("refuses a member id that is not one", async () => {
    const state = await removeMemberAction(
      { status: "idle" },
      removeForm("nope"),
    );

    expect(state.status).toBe("error");
    expect(removeMemberMock).not.toHaveBeenCalled();
  });

  it("asks an expired session to sign in", async () => {
    removeMemberMock.mockRejectedValue(new NotAuthenticatedError());

    expect(
      await removeMemberAction({ status: "idle" }, removeForm()),
    ).toMatchObject({ message: expect.stringContaining("Sign in again") });
  });

  it("keeps an outage on our side of the line", async () => {
    removeMemberMock.mockRejectedValue(new RegistryUnavailableError());

    const state = await removeMemberAction({ status: "idle" }, removeForm());

    expect(state.status).toBe("error");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("inviteMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inviteMemberMock.mockResolvedValue(undefined);
  });

  function invite(overrides: Record<string, string> = {}): FormData {
    const data = new FormData();
    const fields = {
      organisationId: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
      email: "auditor@example.com",
      role: "auditor",
      ...overrides,
    };
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
  }

  it("invites and says who was invited", async () => {
    const result = await inviteMemberAction({ status: "idle" }, invite());

    expect(result).toEqual({
      status: "invited",
      email: "auditor@example.com",
    });
  });

  it("relays a refusal in the registry's own words", async () => {
    inviteMemberMock.mockRejectedValue(
      new RegistryRefusedError(422, "that address cannot receive invitations"),
    );

    const result = await inviteMemberAction({ status: "idle" }, invite());

    expect(result).toEqual({
      status: "error",
      message: "that address cannot receive invitations",
      errors: {},
    });
  });

  it("asks an expired session to sign in rather than losing the page", async () => {
    // This used to rethrow: the whole members screen was replaced by the
    // generic error boundary, taking the list and the typed address with it,
    // because only `RegistryRefusedError` was handled here while both sibling
    // actions handled all four outcomes.
    inviteMemberMock.mockRejectedValue(new NotAuthenticatedError("expired"));

    const result = await inviteMemberAction({ status: "idle" }, invite());

    expect(result.status).toBe("error");
    expect(result).toMatchObject({
      message: expect.stringMatching(/sign in/i),
    });
  });

  it("reports an outage as an outage", async () => {
    inviteMemberMock.mockRejectedValue(new RegistryUnavailableError("down"));

    const result = await inviteMemberAction({ status: "idle" }, invite());

    expect(result.status).toBe("error");
    expect(result).toMatchObject({
      message: expect.stringMatching(/not reachable/i),
    });
  });
});
