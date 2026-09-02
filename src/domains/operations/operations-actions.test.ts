import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  recordVerificationMock,
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
    recordVerificationMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    NotAuthenticatedError,
    RegistryRefusedError,
    RegistryUnavailableError,
  };
});

vi.mock("@/lib/registry/registry-api", () => ({
  recordVerification: recordVerificationMock,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { recordDecisionAction } from "@/domains/operations/operations-actions";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    organisationId: ORG_ID,
    outcome: "verified",
    reviewReason: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("recordDecisionAction", () => {
  beforeEach(() => {
    recordVerificationMock.mockReset();
    revalidatePathMock.mockReset();
    recordVerificationMock.mockResolvedValue({
      organisation_id: ORG_ID,
      verification_status: "verified",
      review_reason: null,
      verified_at: "2026-08-16T12:00:00Z",
    });
  });

  it("approves without a reason", async () => {
    const state = await recordDecisionAction({ status: "idle" }, form());

    expect(recordVerificationMock).toHaveBeenCalledWith(
      ORG_ID,
      "verified",
      null,
    );
    expect(state).toMatchObject({ status: "recorded", outcome: "verified" });
  });

  it("refuses to ask for more without saying what", async () => {
    // The whole point of the state: it tells the holder somebody is waiting on
    // them. Without a reason it tells them nothing and they cannot act.
    const state = await recordDecisionAction(
      { status: "idle" },
      form({ outcome: "needs_attention" }),
    );

    expect(state).toMatchObject({
      status: "error",
      errors: { reviewReason: expect.stringContaining("what is needed") },
    });
    expect(recordVerificationMock).not.toHaveBeenCalled();
  });

  it("refuses to reject without saying why", async () => {
    // A refusal frees the company number, so re-registering is the only way
    // forward — and the holder can only judge that if they know what was wrong.
    const state = await recordDecisionAction(
      { status: "idle" },
      form({ outcome: "rejected" }),
    );

    expect(state).toMatchObject({
      status: "error",
      errors: {
        reviewReason: expect.stringContaining("frees the company number"),
      },
    });
    expect(recordVerificationMock).not.toHaveBeenCalled();
  });

  it("refuses a reason attached to an approval", async () => {
    // Mirrors the registry. A note silently kept on an approval reads later as
    // a caveat on a decision that had none.
    const state = await recordDecisionAction(
      { status: "idle" },
      form({ outcome: "verified", reviewReason: "looks fine" }),
    );

    expect(state.status).toBe("error");
    expect(recordVerificationMock).not.toHaveBeenCalled();
  });

  it("passes the reason through for the two outcomes that carry one", async () => {
    await recordDecisionAction(
      { status: "idle" },
      form({
        outcome: "needs_attention",
        reviewReason: "  Send proof of address.  ",
      }),
    );

    expect(recordVerificationMock).toHaveBeenCalledWith(
      ORG_ID,
      "needs_attention",
      "Send proof of address.",
    );
  });

  it("revalidates nothing, because the flag is global and unmounts the form", async () => {
    // `revalidatePath` does not scope to its argument in Next 16.3: it sets one
    // `store.pathWasRevalidated` flag — its own source carries the comment
    // "TODO: only revalidate if the path matches" — which makes the client
    // refetch the CURRENT route whatever path was named. Refetching
    // /operations drops the just-decided organisation from the queue, and
    // `selected` derives from the queue, so the decision form unmounts and its
    // confirmation is discarded. Naming only the other two paths does not help.
    // Every page here is force-dynamic, so nothing was cached to invalidate.
    await recordDecisionAction({ status: "idle" }, form());

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("relays a conflict, because somebody else decided first", async () => {
    recordVerificationMock.mockRejectedValue(
      new RegistryRefusedError(409, "a decision has already been recorded"),
    );

    const state = await recordDecisionAction({ status: "idle" }, form());

    expect(state).toMatchObject({
      status: "error",
      message: "a decision has already been recorded",
    });
  });

  it("never relays an unavailability's internals", async () => {
    recordVerificationMock.mockRejectedValue(
      new RegistryUnavailableError(
        "registry answered 502 for /orgs/x/verification",
      ),
    );

    const state = await recordDecisionAction({ status: "idle" }, form());

    expect(JSON.stringify(state)).not.toContain("502");
    expect(state).toMatchObject({
      message: expect.stringContaining("Nothing was recorded"),
    });
  });

  it("asks an expired session to sign in again", async () => {
    recordVerificationMock.mockRejectedValue(new NotAuthenticatedError());

    const state = await recordDecisionAction({ status: "idle" }, form());

    expect(state).toMatchObject({
      message: expect.stringContaining("Sign in again"),
    });
  });
});
