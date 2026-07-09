import { describe, expect, it } from "vitest";

import { getEnv, parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("applies defaults when the source is empty", () => {
    const env = parseEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.SENTRY_DSN).toBeUndefined();
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
  });

  it("accepts each valid NODE_ENV value", () => {
    expect(parseEnv({ NODE_ENV: "development" }).NODE_ENV).toBe("development");
    expect(parseEnv({ NODE_ENV: "test" }).NODE_ENV).toBe("test");
    expect(parseEnv({ NODE_ENV: "production" }).NODE_ENV).toBe("production");
  });

  it("rejects an unknown NODE_ENV value", () => {
    expect(() => parseEnv({ NODE_ENV: "staging" })).toThrow();
  });

  it("accepts valid Sentry DSN URLs", () => {
    const env = parseEnv({
      SENTRY_DSN: "https://abc123@o0.ingest.sentry.io/1",
      NEXT_PUBLIC_SENTRY_DSN: "https://def456@o0.ingest.sentry.io/2",
    });

    expect(env.SENTRY_DSN).toBe("https://abc123@o0.ingest.sentry.io/1");
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe(
      "https://def456@o0.ingest.sentry.io/2",
    );
  });

  it("rejects a malformed SENTRY_DSN", () => {
    expect(() => parseEnv({ SENTRY_DSN: "not-a-url" })).toThrow();
  });

  it("rejects a malformed NEXT_PUBLIC_SENTRY_DSN", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SENTRY_DSN: "not-a-url" })).toThrow();
  });

  it("treats empty-string DSNs as absent", () => {
    const env = parseEnv({ SENTRY_DSN: "", NEXT_PUBLIC_SENTRY_DSN: "" });

    expect(env.SENTRY_DSN).toBeUndefined();
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
  });

  it("treats an empty-string NODE_ENV as absent and applies the default", () => {
    expect(parseEnv({ NODE_ENV: "" }).NODE_ENV).toBe("development");
  });
});

describe("getEnv", () => {
  it("parses process.env and returns a cached instance on repeat calls", () => {
    const first = getEnv();
    const second = getEnv();

    expect(first.NODE_ENV).toBe("test");
    expect(second).toBe(first);
  });
});
