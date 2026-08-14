import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

// A class, not vi.fn(() => ...). The action calls `new Resend(key)`, and a
// mock backed by an arrow function is not constructible — it throws a
// TypeError that the action then catches and reports as a send failure, so
// the happy path fails looking exactly like a provider outage.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { requestAccessAction } from "@/lib/access-request";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const IDLE = { status: "idle" } as const;

/** Every line the logger emitted during a test, parsed back from JSON. */
let logged: Record<string, unknown>[] = [];

beforeEach(() => {
  logged = [];
  send.mockReset();
  send.mockResolvedValue({ data: { id: "sent" }, error: null });

  for (const level of ["info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, level).mockImplementation((line: string) => {
      logged.push(JSON.parse(line));
    });
  }

  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("ACCESS_REQUEST_FROM", "register@subrahq.com");
  vi.stubEnv("ACCESS_REQUEST_TO", "valentin@subrahq.com, innocent@subrahq.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("requestAccessAction", () => {
  it("sends the request to every configured recipient", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    expect(result).toEqual({ status: "sent" });
    expect(send).toHaveBeenCalledTimes(1);

    const payload = send.mock.calls[0]![0] as Record<string, unknown>;
    // Comma-separated recipients arrive as a list, trimmed — a single string
    // with a stray space silently drops the second inbox.
    expect(payload["to"]).toEqual([
      "valentin@subrahq.com",
      "innocent@subrahq.com",
    ]);
    // Reply-to means answering the notification answers the prospect.
    expect(payload["replyTo"]).toBe("head.of.risk@firm.co.uk");
  });

  it("never writes the address to the log", async () => {
    await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    // logger.ts forbids PII in fields, and this is the only code path on the
    // site that handles any. The log records that it happened, not who.
    expect(logged.length).toBeGreaterThan(0);
    for (const line of logged) {
      expect(JSON.stringify(line)).not.toContain("head.of.risk");
    }
  });

  it("rejects an address that is not one", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({ email: "not-an-address", company: "" }),
    );

    expect(result.status).toBe("error");
    expect(send).not.toHaveBeenCalled();
  });

  it("reports success to a filled honeypot and sends nothing", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({ email: "bot@spam.example", company: "Acme Corp" }),
    );

    // Telling a bot it was caught is free tuning information for whoever
    // runs it next, so the response is indistinguishable from a real send.
    expect(result).toEqual({ status: "sent" });
    expect(send).not.toHaveBeenCalled();
    expect(
      logged.some((l) => l["event"] === "access_request.honeypot_tripped"),
    ).toBe(true);
  });

  it("degrades to a mail-us message when it is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    // The alternative — requiring these at boot — would take the whole
    // marketing site down because a contact form was not set up yet.
    expect(result.status).toBe("error");
    expect(result.status === "error" && result.message).toContain(
      "contact@subrahq.com",
    );
    expect(send).not.toHaveBeenCalled();

    const line = logged.find(
      (l) => l["event"] === "access_request.not_configured",
    );
    expect(line?.["missing"]).toEqual(["RESEND_API_KEY"]);
  });

  it("names every missing key, not just the first", async () => {
    vi.stubEnv("ACCESS_REQUEST_TO", "");
    vi.stubEnv("ACCESS_REQUEST_FROM", "");

    await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    // Reporting one at a time turns a five-minute fix into three deploys.
    const line = logged.find(
      (l) => l["event"] === "access_request.not_configured",
    );
    expect(line?.["missing"]).toEqual([
      "ACCESS_REQUEST_TO",
      "ACCESS_REQUEST_FROM",
    ]);
  });

  it("treats a submission with no fields at all as invalid", async () => {
    const result = await requestAccessAction(IDLE, new FormData());

    // A hand-rolled POST that omits the field entirely must not read as an
    // empty-but-present honeypot and get reported as sent.
    expect(result.status).toBe("error");
    expect(send).not.toHaveBeenCalled();
  });

  it("surfaces a provider rejection without leaking its detail", async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "domain not verified" },
    });

    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    expect(result.status).toBe("error");
    expect(result.status === "error" && result.message).not.toContain(
      "domain not verified",
    );
  });

  it("survives the provider throwing", async () => {
    send.mockRejectedValue(new TypeError("fetch failed"));

    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    // A network blip must not surface as an unhandled rejection in a server
    // action — the visitor gets a route to a human either way.
    expect(result.status).toBe("error");
    expect(logged.some((l) => l["event"] === "access_request.send_threw")).toBe(
      true,
    );
  });

  it("survives the provider throwing something that is not an Error", async () => {
    send.mockRejectedValue("gateway said no");

    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    expect(result.status).toBe("error");
    const line = logged.find((l) => l["event"] === "access_request.send_threw");
    // A thrown string has no `.name`; reading one off it would put
    // "undefined" in the log where a reason belongs.
    expect(line?.["reason"]).toBe("unknown");
  });
});
