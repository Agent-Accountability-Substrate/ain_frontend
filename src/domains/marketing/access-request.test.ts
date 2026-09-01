import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send, forwardedFor } = vi.hoisted(() => ({
  send: vi.fn(),
  // Null by default: no proxy header, so the per-caller budget is skipped and
  // only the shared ceiling applies. Tests that want throttling set an address.
  forwardedFor: vi.fn<() => string | null>(() => null),
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => forwardedFor() }),
}));

// A class, not vi.fn(() => ...). The action calls `new Resend(key)`, and a
// mock backed by an arrow function is not constructible — it throws a
// TypeError that the action then catches and reports as a send failure, so
// the happy path fails looking exactly like a provider outage.
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

import { requestAccessAction } from "@/domains/marketing/access-request";
import { resetRateLimits } from "@/lib/rate-limit";

/**
 * A well-formed submission, so each test states only what it varies. `name`
 * is required by the schema, and defaulting it here keeps the tests about the
 * thing they are each testing rather than about form completeness.
 */
function form(fields: Record<string, string>) {
  const { company, ...provided } = fields;
  const data = new FormData();
  for (const [key, value] of Object.entries({
    name: "Ada Lovelace",
    organisation: "Example Financial Services",
    role: "Head of Risk",
    workflow: "Payments operations",
    website: company ?? "",
    ...provided,
  })) {
    data.append(key, value);
  }
  return data;
}

const IDLE = { status: "idle" } as const;

/** Every line the logger emitted during a test, parsed back from JSON. */
let logged: Record<string, unknown>[] = [];

/** The project root the fallback resolves `var/` against. */
const REPO_ROOT = process.cwd();
let root: string;

beforeEach(async () => {
  // The fallback writes to `var/` under the working directory. Moved to a
  // temporary one so the suite never writes a request into the repository.
  root = await mkdtemp(join(tmpdir(), "subra-access-"));
  process.chdir(root);
  logged = [];
  // The counters are module state, so they outlive a test unless cleared.
  resetRateLimits();
  forwardedFor.mockReturnValue(null);
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
  process.chdir(REPO_ROOT);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Blocks the fallback, so the paths that end in a user-facing error can run. */
async function breakFallback() {
  await writeFile(join(root, "var"), "not a directory", "utf8");
}

/** Every request kept by the fallback, parsed back. */
async function kept() {
  return (await readFile(join(root, "var", "access-requests.jsonl"), "utf8"))
    .split(String.fromCharCode(10))
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

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
    expect(payload["text"]).toContain(
      "Organisation: Example Financial Services",
    );
    expect(payload["text"]).toContain("Role: Head of Risk");
    expect(payload["text"]).toContain("Agent workflow: Payments operations");
  });

  it("stops one caller looping the form", async () => {
    forwardedFor.mockReturnValue("203.0.113.7, 10.0.0.1");

    const attempts = [];
    for (let i = 0; i < 7; i += 1) {
      attempts.push(
        await requestAccessAction(
          IDLE,
          form({ email: `bot${i}@spam.example`, company: "" }),
        ),
      );
    }

    // Nothing authenticates this action, so an unbounded loop would deliver a
    // mail per iteration and bill for every one.
    expect(send).toHaveBeenCalledTimes(5);
    expect(attempts.slice(0, 5).every((r) => r.status === "sent")).toBe(true);
    expect(attempts.slice(5).every((r) => r.status === "error")).toBe(true);

    const line = logged.find(
      (l) => l["event"] === "access_request.rate_limited",
    );
    expect(line?.["scoped"]).toBe(true);
    // The address is the thing being throttled, so it is the thing most
    // likely to end up in the log line by accident.
    expect(JSON.stringify(logged)).not.toContain("203.0.113.7");
  });

  it("holds a shared ceiling when there is no address to key on", async () => {
    // Rotating x-forwarded-for defeats the per-caller budget, so the ceiling
    // is what actually protects the send quota and the sending domain.
    for (let i = 0; i < 61; i += 1) {
      await requestAccessAction(
        IDLE,
        form({ email: `bot${i}@spam.example`, company: "" }),
      );
    }

    expect(send).toHaveBeenCalledTimes(60);
    const line = logged.find(
      (l) => l["event"] === "access_request.rate_limited",
    );
    expect(line?.["scoped"]).toBe(false);
  });

  it("drops empty recipients left by a stray separator", async () => {
    vi.stubEnv("ACCESS_REQUEST_TO", "valentin@subrahq.com,");

    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    // A trailing comma is the usual way this env var gets written, and an
    // empty string in the list makes Resend reject the whole message.
    expect(result).toEqual({ status: "sent" });
    const payload = send.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload["to"]).toEqual(["valentin@subrahq.com"]);
  });

  it("reads a separator with no address as unconfigured", async () => {
    vi.stubEnv("ACCESS_REQUEST_TO", " , ");

    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    // Truthy but naming nobody. Read as configured, it would fail every send
    // with no hint at the cause.
    expect(result).toEqual({ status: "sent" });
    expect(send).not.toHaveBeenCalled();
    expect(await kept()).toHaveLength(1);
    const line = logged.find(
      (l) => l["event"] === "access_request.not_configured",
    );
    expect(line?.["missing"]).toEqual(["ACCESS_REQUEST_TO"]);
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

    expect(result).toMatchObject({
      status: "error",
      fieldErrors: { email: "Enter a valid work email address." },
      values: { name: "Ada Lovelace", email: "not-an-address" },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("names both fields when neither is usable", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({ name: "", email: "", company: "" }),
    );

    expect(result.status).toBe("error");
    expect(result).toMatchObject({
      fieldErrors: {
        name: "This field is required.",
        email: "This field is required.",
      },
    });
  });

  it("names the name when only the name is missing", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({ name: "  ", email: "head.of.risk@firm.co.uk", company: "" }),
    );

    expect(result).toMatchObject({
      fieldErrors: { name: "This field is required." },
    });
  });

  it("says which field is too long rather than blaming the other one", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({
        name: "A".repeat(201),
        email: "head.of.risk@firm.co.uk",
        company: "",
      }),
    );

    // The address here is perfectly good. Inferring the message from an empty
    // name reported this as a bad email — the one field with nothing wrong.
    expect(result).toMatchObject({
      fieldErrors: { name: "Keep this under 200 characters." },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps the length reason when the address failed as well", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({
        name: "A".repeat(201),
        email: "not-an-address",
        company: "",
      }),
    );

    // Reporting only "enter your name" beside a box the visitor can see is
    // full sends them back for the address alone, and they learn about the
    // ceiling on the next attempt — two round trips for one form.
    expect(result).toMatchObject({
      fieldErrors: {
        name: "Keep this under 200 characters.",
        email: "Enter a valid work email address.",
      },
    });
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

  it("degrades to a mail-us message when nothing can take the request", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await breakFallback();

    const result = await requestAccessAction(
      IDLE,
      form({ email: "head.of.risk@firm.co.uk", company: "" }),
    );

    // Mail unconfigured and the fallback blocked: the only case left where the
    // visitor is asked to write to us instead.
    expect(result.status).toBe("error");
    expect(result.status === "error" && result.message).toContain(
      "partner@subrahq.com",
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
    await breakFallback();

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
    await breakFallback();

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
    await breakFallback();

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

describe("requestAccessAction · the name field", () => {
  it("refuses a submission with no name, and says which field is missing", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({ name: "", email: "head.of.risk@firm.co.uk", company: "" }),
    );

    expect(result.status).toBe("error");
    // Two required fields and one message, so the message has to name the one
    // at fault — "enter a work email" beside a filled email box is worse than
    // no message at all.
    expect(result).toMatchObject({
      fieldErrors: { name: "This field is required." },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("forwards the name so a reply can open with it", async () => {
    await requestAccessAction(
      IDLE,
      form({ name: "Ada Lovelace", email: "ada@firm.co.uk", company: "" }),
    );

    const [message] = send.mock.calls[0] as [{ text: string }];
    expect(message.text).toContain("Ada Lovelace");
    expect(message.text).toContain("ada@firm.co.uk");
  });

  it("never logs the name, the same as the address", async () => {
    await requestAccessAction(
      IDLE,
      form({ name: "Ada Lovelace", email: "ada@firm.co.uk", company: "" }),
    );

    const serialised = JSON.stringify(logged);
    expect(serialised).not.toContain("Ada Lovelace");
    expect(serialised).not.toContain("ada@firm.co.uk");
  });

  it("carries both fields back when the send fails, so nothing is retyped", async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: "application_error" },
    });
    await breakFallback();

    const result = await requestAccessAction(
      IDLE,
      form({ name: "Ada Lovelace", email: "ada@firm.co.uk", company: "" }),
    );

    // React resets an uncontrolled input once the action returns, so a failed
    // send that dropped these would empty the boxes the visitor just filled.
    expect(result).toMatchObject({
      status: "error",
      values: {
        name: "Ada Lovelace",
        email: "ada@firm.co.uk",
        organisation: "Example Financial Services",
        role: "Head of Risk",
        workflow: "Payments operations",
      },
    });
  });

  it("still reports a tripped honeypot as sent, name or no name", async () => {
    const result = await requestAccessAction(
      IDLE,
      form({ name: "", email: "bot@spam.example", company: "Acme Corp" }),
    );

    expect(result).toEqual({ status: "sent" });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("requestAccessAction · the fallback file", () => {
  const cwd = process.cwd();
  let root: string;
  let sink: string;

  beforeEach(async () => {
    // The path is fixed relative to the working directory, so the suite moves
    // the working directory rather than configuring the path.
    root = await mkdtemp(join(tmpdir(), "subra-access-"));
    sink = join(root, "var", "access-requests.jsonl");
    process.chdir(root);
  });

  afterEach(() => {
    process.chdir(cwd);
  });

  /** Every request in the sink, parsed back. */
  async function written() {
    return (await readFile(sink, "utf8"))
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  }

  it("keeps the request when mail is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await requestAccessAction(
      IDLE,
      form({ email: "ada@firm.co.uk" }),
    );

    expect(result).toEqual({ status: "sent" });
    expect(await written()).toEqual([
      {
        name: "Ada Lovelace",
        email: "ada@firm.co.uk",
        organisation: "Example Financial Services",
        role: "Head of Risk",
        workflow: "Payments operations",
        receivedAt: expect.any(String),
      },
    ]);
  });

  it("keeps the request when the provider rejects it", async () => {
    send.mockResolvedValue({ data: null, error: { name: "rate_limit" } });

    expect(
      await requestAccessAction(IDLE, form({ email: "ada@firm.co.uk" })),
    ).toEqual({ status: "sent" });
    expect(await written()).toHaveLength(1);
  });

  it("keeps the request when the provider throws", async () => {
    send.mockRejectedValue(new Error("socket hang up"));

    expect(
      await requestAccessAction(IDLE, form({ email: "ada@firm.co.uk" })),
    ).toEqual({ status: "sent" });
    expect(await written()).toHaveLength(1);
  });

  it("creates the directory on the first request", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    // `var/` is gitignored, so a fresh checkout does not have one.
    await requestAccessAction(IDLE, form({ email: "ada@firm.co.uk" }));

    expect(await written()).toHaveLength(1);
  });

  it("appends rather than replacing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    await requestAccessAction(IDLE, form({ email: "ada@firm.co.uk" }));
    await requestAccessAction(IDLE, form({ email: "grace@firm.co.uk" }));

    expect((await written()).map((entry) => entry.email)).toEqual([
      "ada@firm.co.uk",
      "grace@firm.co.uk",
    ]);
  });

  it("never records the honeypot alongside the request", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    await requestAccessAction(IDLE, form({ email: "ada@firm.co.uk" }));

    expect(Object.keys((await written())[0]!)).not.toContain("website");
  });

  it("says a request was kept without saying whose", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    await requestAccessAction(IDLE, form({ email: "ada@firm.co.uk" }));

    expect(logged.map((line) => line.event)).toContain(
      "access_request.written_to_fallback",
    );
    expect(JSON.stringify(logged)).not.toContain("ada@firm.co.uk");
  });

  it("falls back to the mail-us message when the file cannot be written", async () => {
    // `var` already exists as a file. Reporting success here would tell the
    // visitor we have their request when nothing kept it.
    vi.stubEnv("RESEND_API_KEY", "");
    await writeFile(join(root, "var"), "not a directory", "utf8");

    expect(
      await requestAccessAction(IDLE, form({ email: "ada@firm.co.uk" })),
    ).toMatchObject({ status: "error" });
    expect(logged.map((line) => line.event)).toContain(
      "access_request.fallback_failed",
    );
  });
});
