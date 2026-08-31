import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  registerAgentMock,
  patchAgentMock,
  submitAgentMock,
  transitionAgentMock,
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
    registerAgentMock: vi.fn(),
    patchAgentMock: vi.fn(),
    submitAgentMock: vi.fn(),
    transitionAgentMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    NotAuthenticatedError,
    RegistryRefusedError,
    RegistryUnavailableError,
  };
});

vi.mock("@/lib/registry/registry-api", () => ({
  registerAgent: registerAgentMock,
  patchAgent: patchAgentMock,
  submitAgent: submitAgentMock,
  transitionAgent: transitionAgentMock,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  patchAgentAction,
  registerAgentAction,
  submitAgentAction,
  transitionAgentAction,
} from "@/domains/agents/agent-actions";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const AIN = "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const IDENTITY = {
  organisationId: ORG_ID,
  name: "Payments Operations Agent",
  role: "Initiates supplier payments",
  riskClass: "high",
};

const DECLARATION = {
  organisationId: ORG_ID,
  ain: AIN,
  actionClasses: "payments.initiate\ncustomer_comms.send",
  riskLevel: "high",
  regulatoryMappings: "FCA CONC 7",
  roleTitle: "Head of Collections",
  responsibilityArea: "collections",
  regulatoryIdentifier: "SMF24-000123",
};

describe("registerAgentAction", () => {
  beforeEach(() => {
    registerAgentMock.mockReset();
    registerAgentMock.mockResolvedValue({
      agent_id: ORG_ID,
      ain: AIN,
      status: "draft",
    });
  });

  it("mints an identifier and hands the AIN to the next step", async () => {
    const state = await registerAgentAction({ status: "idle" }, form(IDENTITY));

    expect(registerAgentMock).toHaveBeenCalledWith(ORG_ID, {
      organisationId: ORG_ID,
      name: "Payments Operations Agent",
      role: "Initiates supplier payments",
      riskClass: "high",
    });
    expect(state).toEqual({ status: "done", ain: AIN });
  });

  it("refuses an incomplete identity without calling the registry", async () => {
    const state = await registerAgentAction(
      { status: "idle" },
      form({ ...IDENTITY, name: "  " }),
    );

    expect(state).toMatchObject({ status: "error" });
    expect(registerAgentMock).not.toHaveBeenCalled();
  });

  it("relays the registry's refusal for an unverified organisation", async () => {
    // The wizard blocks this up front, but a stale page could still reach it —
    // and 403 "organisation is not verified" is exactly what to show.
    registerAgentMock.mockRejectedValue(
      new RegistryRefusedError(403, "organisation is not verified"),
    );

    const state = await registerAgentAction({ status: "idle" }, form(IDENTITY));

    expect(state).toMatchObject({
      status: "error",
      message: "organisation is not verified",
    });
  });
});

describe("patchAgentAction", () => {
  beforeEach(() => {
    patchAgentMock.mockReset();
    patchAgentMock.mockResolvedValue(undefined);
  });

  it("sorts and de-duplicates the declared action classes", async () => {
    // The contract requires them sorted and duplicate-free. Order carries no
    // meaning, so it is normalised for the caller rather than demanded of them.
    await patchAgentAction(
      { status: "idle" },
      form({
        ...DECLARATION,
        actionClasses:
          "payments.initiate\ncustomer_comms.send\npayments.initiate",
      }),
    );

    const [, , patch] = patchAgentMock.mock.calls[0] as [string, string, never];
    expect(
      (patch as { scope: { actionClasses: string[] } }).scope.actionClasses,
    ).toEqual(["customer_comms.send", "payments.initiate"]);
  });

  it("sends no constraints rather than a placeholder", async () => {
    // Every constraint key must name a declared action class, so an empty
    // object is the honest "none stated".
    await patchAgentAction({ status: "idle" }, form(DECLARATION));

    const [, , patch] = patchAgentMock.mock.calls[0] as [string, string, never];
    expect(
      (patch as { scope: { constraints: object } }).scope.constraints,
    ).toEqual({});
  });

  it("carries the accountable person's SMCR reference through", async () => {
    await patchAgentAction({ status: "idle" }, form(DECLARATION));

    const [, , patch] = patchAgentMock.mock.calls[0] as [string, string, never];
    expect((patch as { accountability: object }).accountability).toEqual({
      roleTitle: "Head of Collections",
      responsibilityArea: "collections",
      regulatoryIdentifier: "SMF24-000123",
    });
  });

  it("refuses a scope that declares nothing", async () => {
    // Deny-all stays expressible, but only explicitly — an empty box must not
    // silently become one.
    const state = await patchAgentAction(
      { status: "idle" },
      form({ ...DECLARATION, actionClasses: "   " }),
    );

    expect(state).toMatchObject({
      status: "error",
      errors: { actionClasses: expect.stringContaining("at least one") },
    });
    expect(patchAgentMock).not.toHaveBeenCalled();
  });

  it("relays the registry's refusal of a scope it will not accept", async () => {
    patchAgentMock.mockRejectedValue(
      new RegistryRefusedError(409, "the agent is no longer a draft"),
    );

    const state = await patchAgentAction({ status: "idle" }, form(DECLARATION));

    expect(state).toMatchObject({
      status: "error",
      message: "the agent is no longer a draft",
    });
  });

  it("lets an unrecognised failure through instead of calling it a refusal", async () => {
    // Only the registry's own refusals become an error state. Anything else is
    // a defect, and rendering it as "we could not do that" would hide it.
    patchAgentMock.mockRejectedValue(new TypeError("undefined is not a"));

    await expect(
      patchAgentAction({ status: "idle" }, form(DECLARATION)),
    ).rejects.toThrow(TypeError);
  });

  it("falls back to plain words when a 503 names no subsystem", async () => {
    patchAgentMock.mockRejectedValue(
      new RegistryUnavailableError("registry answered 503"),
    );

    const state = await patchAgentAction({ status: "idle" }, form(DECLARATION));

    expect(state).toMatchObject({
      status: "error",
      message: expect.stringMatching(/try again/i),
    });
  });

  it("refuses a declaration with no accountable person", async () => {
    const state = await patchAgentAction(
      { status: "idle" },
      form({ ...DECLARATION, regulatoryIdentifier: "" }),
    );

    expect(state).toMatchObject({
      status: "error",
      errors: { regulatoryIdentifier: expect.stringContaining("SMCR") },
    });
    expect(patchAgentMock).not.toHaveBeenCalled();
  });
});

describe("submitAgentAction", () => {
  beforeEach(() => {
    submitAgentMock.mockReset();
    revalidatePathMock.mockReset();
    submitAgentMock.mockResolvedValue({
      ain: AIN,
      status: "active",
      document_version: 1,
      document_hash: "a".repeat(64),
      kid: "kid-1",
      chain_head: "b".repeat(64),
      resolver_url: "https://resolve.ain.test/" + AIN,
    });
  });

  it("returns what the caller needs to prove the agent exists", async () => {
    const state = await submitAgentAction(
      { status: "idle" },
      form({ organisationId: ORG_ID, ain: AIN }),
    );

    expect(state).toEqual({
      status: "done",
      ain: AIN,
      resolverUrl: "https://resolve.ain.test/" + AIN,
      documentVersion: 1,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/o", "layout");
  });

  it("says which subsystem is unconfigured rather than advising a retry", async () => {
    // Issuance is the one step needing custody. Without Vault the registry
    // refuses rather than signing under a development key, and "try again
    // shortly" would be advice that can never work.
    submitAgentMock.mockRejectedValue(
      new RegistryUnavailableError("registry answered 503", {
        detail: "issuance signing is not configured",
      }),
    );

    const state = await submitAgentAction(
      { status: "idle" },
      form({ organisationId: ORG_ID, ain: AIN }),
    );

    expect(state).toMatchObject({
      status: "error",
      message: "issuance signing is not configured",
    });
  });

  it("refuses a draft it cannot address", async () => {
    const state = await submitAgentAction(
      { status: "idle" },
      form({ organisationId: "not-a-uuid", ain: AIN }),
    );

    expect(state).toMatchObject({
      status: "error",
      message: expect.stringContaining("no longer addressable"),
    });
    expect(submitAgentMock).not.toHaveBeenCalled();
  });

  it("asks an expired session to sign in again", async () => {
    submitAgentMock.mockRejectedValue(new NotAuthenticatedError());

    const state = await submitAgentAction(
      { status: "idle" },
      form({ organisationId: ORG_ID, ain: AIN }),
    );

    expect(state).toMatchObject({
      message: expect.stringContaining("Sign in again"),
    });
  });
});

describe("scope constraints", () => {
  function declaration(rows: [string, string, string, string][]): FormData {
    const data = new FormData();
    data.set("organisationId", ORG_ID);
    data.set("ain", AIN);
    data.set("actionClasses", "payments.initiate\ncustomer_comms.send");
    data.set("riskLevel", "high");
    data.set("regulatoryMappings", "");
    data.set("roleTitle", "Head of Collections");
    data.set("responsibilityArea", "collections");
    data.set("regulatoryIdentifier", "SMF24-000123");
    for (const [actionClass, key, type, value] of rows) {
      data.append("constraintClass", actionClass);
      data.append("constraintKey", key);
      data.append("constraintType", type);
      data.append("constraintValue", value);
    }
    return data;
  }

  beforeEach(() => {
    patchAgentMock.mockReset();
    patchAgentMock.mockResolvedValue(undefined);
  });

  it("sends a numeric bound as a number, not as its text", async () => {
    // The evaluator refuses a bound of the wrong type, so a form that posted
    // everything as a string would declare bounds that only fail at admission.
    await patchAgentAction(
      { status: "idle" },
      declaration([["payments.initiate", "max_value_gbp", "number", "5000"]]),
    );

    expect(patchAgentMock.mock.calls[0]![2].scope.constraints).toEqual({
      "payments.initiate": { max_value_gbp: 5000 },
    });
  });

  it("keeps booleans out of the number domain", async () => {
    // `isinstance(True, int)` is true in Python, so `true` must never slip
    // under a positive ceiling.
    await patchAgentAction(
      { status: "idle" },
      declaration([
        ["payments.initiate", "requires_review", "boolean", "true"],
      ]),
    );

    expect(patchAgentMock.mock.calls[0]![2].scope.constraints).toEqual({
      "payments.initiate": { requires_review: true },
    });
  });

  it("sorts and dedupes a list bound", async () => {
    await patchAgentAction(
      { status: "idle" },
      declaration([
        ["payments.initiate", "currencies", "string_list", "GBP, EUR, GBP"],
      ]),
    );

    expect(patchAgentMock.mock.calls[0]![2].scope.constraints).toEqual({
      "payments.initiate": { currencies: ["EUR", "GBP"] },
    });
  });

  it("gathers several bounds on one action class", async () => {
    await patchAgentAction(
      { status: "idle" },
      declaration([
        ["payments.initiate", "max_value_gbp", "number", "5000"],
        ["payments.initiate", "currencies", "string_list", "GBP"],
      ]),
    );

    expect(patchAgentMock.mock.calls[0]![2].scope.constraints).toEqual({
      "payments.initiate": { max_value_gbp: 5000, currencies: ["GBP"] },
    });
  });

  it("refuses a bound naming an action class that was not declared", async () => {
    // Contract v1 requires every constraint key to name a declared class.
    const state = await patchAgentAction(
      { status: "idle" },
      declaration([["payments.refund", "max_value_gbp", "number", "5000"]]),
    );

    expect(state.status).toBe("error");
    expect(patchAgentMock).not.toHaveBeenCalled();
  });

  it("refuses a numeric bound that is not a number", async () => {
    const state = await patchAgentAction(
      { status: "idle" },
      declaration([["payments.initiate", "max_value_gbp", "number", "lots"]]),
    );

    expect(state.status).toBe("error");
    expect(patchAgentMock).not.toHaveBeenCalled();
  });

  it("ignores a row somebody added and left blank", async () => {
    await patchAgentAction(
      { status: "idle" },
      declaration([["", "", "number", ""]]),
    );

    expect(patchAgentMock.mock.calls[0]![2].scope.constraints).toEqual({});
  });

  it("sends a text bound as text", async () => {
    await patchAgentAction(
      { status: "idle" },
      declaration([["customer_comms.send", "channel", "string", "email"]]),
    );

    expect(patchAgentMock.mock.calls[0]![2].scope.constraints).toEqual({
      "customer_comms.send": { channel: "email" },
    });
  });

  it("refuses a boolean bound that is neither true nor false", async () => {
    const state = await patchAgentAction(
      { status: "idle" },
      declaration([["payments.initiate", "reviewed", "boolean", "yes"]]),
    );

    expect(state.status).toBe("error");
  });

  it("refuses a bound with a value type this build cannot compare", async () => {
    // The operator set is closed in code; a type this build does not implement
    // must fail here rather than silently denying live traffic later.
    const state = await patchAgentAction(
      { status: "idle" },
      declaration([["payments.initiate", "window", "duration", "P1D"]]),
    );

    expect(state.status).toBe("error");
  });

  it("refuses a bound on a named class with no key", async () => {
    const state = await patchAgentAction(
      { status: "idle" },
      declaration([["payments.initiate", "", "number", "5000"]]),
    );

    expect(state.status).toBe("error");
  });

  it("refuses a bound with no value", async () => {
    const state = await patchAgentAction(
      { status: "idle" },
      declaration([["payments.initiate", "max_value_gbp", "number", "  "]]),
    );

    expect(state.status).toBe("error");
  });

  it("refuses an empty list bound", async () => {
    const state = await patchAgentAction(
      { status: "idle" },
      declaration([["payments.initiate", "currencies", "string_list", " , "]]),
    );

    expect(state.status).toBe("error");
  });

  it("declares an unbounded scope when no bound is stated", async () => {
    // An empty object is the honest "none stated" — a real thing to declare.
    await patchAgentAction({ status: "idle" }, declaration([]));

    expect(patchAgentMock.mock.calls[0]![2].scope.constraints).toEqual({});
  });
});

describe("transitionAgentAction", () => {
  function transitionForm(
    transition: string,
    reason = "Model replaced",
  ): FormData {
    const data = new FormData();
    data.set("organisationId", ORG_ID);
    data.set("ain", AIN);
    data.set("transition", transition);
    data.set("reason", reason);
    return data;
  }

  beforeEach(() => {
    transitionAgentMock.mockReset();
    revalidatePathMock.mockReset();
    transitionAgentMock.mockResolvedValue({
      ain: AIN,
      status: "suspended",
      event_type: "suspended",
      seq: 3,
      chain_head: "abc",
    });
  });

  it("records a suspension and refreshes what reads the status", async () => {
    const state = await transitionAgentAction(
      { status: "idle" },
      transitionForm("suspend"),
    );

    expect(state).toEqual({
      status: "done",
      agentStatus: "suspended",
      eventType: "suspended",
      seq: 3,
    });
    expect(transitionAgentMock).toHaveBeenCalledWith(
      ORG_ID,
      AIN,
      "suspend",
      "Model replaced",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/o", "layout");
  });

  it("requires a reason, which the registry does too", async () => {
    const state = await transitionAgentAction(
      { status: "idle" },
      transitionForm("revoke", "   "),
    );

    expect(state.status).toBe("error");
    expect(transitionAgentMock).not.toHaveBeenCalled();
  });

  it("refuses a transition this release does not model", async () => {
    const state = await transitionAgentAction(
      { status: "idle" },
      transitionForm("reinstate"),
    );

    expect(state.status).toBe("error");
    expect(transitionAgentMock).not.toHaveBeenCalled();
  });

  it("relays the registry's refusal when somebody moved the agent first", async () => {
    transitionAgentMock.mockRejectedValue(
      new RegistryRefusedError(409, "this agent is revoked, which is terminal"),
    );

    const state = await transitionAgentAction(
      { status: "idle" },
      transitionForm("suspend"),
    );

    expect(state).toMatchObject({
      status: "error",
      message: "this agent is revoked, which is terminal",
    });
  });
});
