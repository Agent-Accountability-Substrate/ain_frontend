import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requestEvidencePackMock,
  revalidatePathMock,
  NotAuthenticatedError,
  RegistryRefusedError,
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
  class RegistryRefusedError extends Error {
    constructor(
      readonly status: number,
      readonly detail: string,
    ) {
      super(detail);
    }
  }
  return {
    requestEvidencePackMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    NotAuthenticatedError,
    RegistryRefusedError,
    RegistryUnavailableError,
  };
});

vi.mock("@/lib/registry/registry-api", () => ({
  requestEvidencePack: requestEvidencePackMock,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { requestEvidencePackAction } from "@/domains/agents/evidence-actions";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";
const PACK_ID = "0b6f1d2c-8a4e-4f19-9c3d-5e7a1b2c4d6f";

function period(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const fields: Record<string, string> = {
    organisationId: ORG_ID,
    ain: AIN,
    from: "2026-07-01",
    to: "2026-07-31",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  return form;
}

const requested = {
  packId: PACK_ID,
  ain: AIN,
  packType: "agent-activity",
  packVersion: "1",
  rangeStart: "2026-07-01T00:00:00Z",
  rangeEnd: "2026-07-31T23:59:59Z",
  status: "queued" as const,
  createdAt: "2026-08-01T06:00:00Z",
};

describe("requesting an evidence package", () => {
  beforeEach(() => {
    requestEvidencePackMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("sends whole days in UTC at both ends of the period", async () => {
    requestEvidencePackMock.mockResolvedValue(requested);

    const state = await requestEvidencePackAction({ status: "idle" }, period());

    expect(state).toEqual({ status: "done", packId: PACK_ID });
    expect(requestEvidencePackMock).toHaveBeenCalledWith(ORG_ID, AIN, {
      packType: "agent-activity",
      packVersion: "1",
      // The last day is included to its final second. Stopping at its first
      // instant would silently drop a day a person believed they had asked for.
      rangeStart: "2026-07-01T00:00:00Z",
      rangeEnd: "2026-07-31T23:59:59Z",
    });
  });

  it("refreshes the list the package will appear in", async () => {
    requestEvidencePackMock.mockResolvedValue(requested);

    await requestEvidencePackAction({ status: "idle" }, period());

    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/o/[org]/agents/[ain]/evidence-packs",
      "page",
    );
  });

  it("refuses a period that ends before it starts", async () => {
    const state = await requestEvidencePackAction(
      { status: "idle" },
      period({ from: "2026-07-31", to: "2026-07-01" }),
    );

    expect(state).toMatchObject({
      status: "error",
      errors: { to: "The period must not end before it starts" },
    });
    expect(requestEvidencePackMock).not.toHaveBeenCalled();
  });

  it("refuses a date that does not exist", async () => {
    // `2026-07-32` matches the shape and is not a day. Left unchecked it would
    // reach the registry as a well-formed timestamp naming nothing.
    const state = await requestEvidencePackAction(
      { status: "idle" },
      period({ to: "2026-07-32" }),
    );

    expect(state).toMatchObject({ status: "error" });
    expect(requestEvidencePackMock).not.toHaveBeenCalled();
  });

  it("refuses a day its month does not have", async () => {
    // `2026-02-30` parses: V8 rolls it into 2 March rather than refusing it,
    // so the schema prints the parsed day back and compares.
    const state = await requestEvidencePackAction(
      { status: "idle" },
      period({ from: "2026-02-01", to: "2026-02-30" }),
    );

    expect(state).toMatchObject({
      status: "error",
      errors: { to: "Choose a real date" },
    });
    expect(requestEvidencePackMock).not.toHaveBeenCalled();
  });

  it("puts a refusal about the period beside the period", async () => {
    requestEvidencePackMock.mockRejectedValue(
      new RegistryRefusedError(409, "agent has not been issued"),
    );

    const state = await requestEvidencePackAction({ status: "idle" }, period());

    expect(state).toMatchObject({
      status: "error",
      message: "agent has not been issued",
      errors: { to: "agent has not been issued" },
    });
  });

  it("keeps an outage in the banner rather than on a field", async () => {
    requestEvidencePackMock.mockRejectedValue(
      new RegistryUnavailableError("down"),
    );

    const state = await requestEvidencePackAction({ status: "idle" }, period());

    expect(state).toMatchObject({ status: "error", errors: {} });
  });

  it("tells an expired session to sign in again", async () => {
    requestEvidencePackMock.mockRejectedValue(new NotAuthenticatedError());

    const state = await requestEvidencePackAction({ status: "idle" }, period());

    expect(state).toMatchObject({
      status: "error",
      message: expect.stringContaining("Sign in again"),
    });
  });

  it("never logs what the package is about", async () => {
    const { logger } = await import("@/lib/logger");
    requestEvidencePackMock.mockResolvedValue(requested);

    await requestEvidencePackAction({ status: "idle" }, period());

    // A log line naming the organisation, the agent or the period would
    // accumulate exactly the record this product exists to keep in one place.
    const logged = JSON.stringify(vi.mocked(logger.info).mock.calls);
    expect(logged).not.toContain(ORG_ID);
    expect(logged).not.toContain(AIN);
    expect(logged).not.toContain("2026-07");
  });
});
