import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createOrganisationMock,
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
    revalidatePathMock: vi.fn(),
    NotAuthenticatedError,
    RegistryRefusedError,
    RegistryUnavailableError,
  };
});

vi.mock("@/lib/registry/registry-api", () => ({
  createOrganisation: createOrganisationMock,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { createOrganisationAction } from "@/domains/organisations/organisation-actions";

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
    // Both are server-rendered from the registry per request, so without this
    // the organisation someone just created is missing from the page they
    // land on next.
    await createOrganisationAction({ status: "idle" }, form());

    expect(revalidatePathMock).toHaveBeenCalledWith("/organisations");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
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
