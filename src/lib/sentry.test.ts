import * as sentrySdk from "@sentry/nextjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { initSentry, shouldInitSentry } from "@/lib/sentry";

vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
}));

const serverDsn = "https://abc123@o0.ingest.sentry.io/1";
const clientDsn = "https://def456@o0.ingest.sentry.io/2";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("shouldInitSentry", () => {
  it("returns false for undefined", () => {
    expect(shouldInitSentry(undefined)).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(shouldInitSentry("")).toBe(false);
  });

  it("returns true for a non-empty DSN", () => {
    expect(shouldInitSentry(serverDsn)).toBe(true);
  });
});

describe("initSentry", () => {
  it("returns false and does not init when the server DSN is unset", async () => {
    vi.stubEnv("SENTRY_DSN", "");

    await expect(initSentry("server")).resolves.toBe(false);
    expect(vi.mocked(sentrySdk.init)).not.toHaveBeenCalled();
  });

  it("returns false and does not init when the client DSN is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");

    await expect(initSentry("client")).resolves.toBe(false);
    expect(vi.mocked(sentrySdk.init)).not.toHaveBeenCalled();
  });

  it("initializes with the server DSN and PII disabled", async () => {
    vi.stubEnv("SENTRY_DSN", serverDsn);

    await expect(initSentry("server")).resolves.toBe(true);
    expect(vi.mocked(sentrySdk.init)).toHaveBeenCalledExactlyOnceWith({
      dsn: serverDsn,
      sendDefaultPii: false,
    });
  });

  it("initializes with the client DSN and PII disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", clientDsn);

    await expect(initSentry("client")).resolves.toBe(true);
    expect(vi.mocked(sentrySdk.init)).toHaveBeenCalledExactlyOnceWith({
      dsn: clientDsn,
      sendDefaultPii: false,
    });
  });
});
