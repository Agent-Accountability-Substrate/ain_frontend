import { afterEach, describe, expect, it, vi } from "vitest";

import { getServerEnv, parseServerEnv } from "@/lib/config/server-env";

afterEach(() => {
  vi.unstubAllEnvs();
});

const valid = {
  AUTH_SECRET: "0123456789abcdef0123456789abcdef",
  AUTH_AUTH0_ID: "client-id",
  AUTH_AUTH0_SECRET: "client-secret",
  AUTH_AUTH0_ISSUER: "https://tenant.uk.auth0.com",
  AUTH_AUTH0_AUDIENCE: "https://api.subrahq.com",
};

/** Production also needs the two origins that must never be guessed. */
const validProduction = {
  ...valid,
  NODE_ENV: "production",
  AUTH_URL: "https://ain.example.com",
  AIN_API_BASE_URL: "https://api.subrahq.com",
};

describe("parseServerEnv", () => {
  it("parses a valid development config (AUTH_URL optional)", () => {
    const env = parseServerEnv({ ...valid, NODE_ENV: "development" });
    expect(env.AUTH_AUTH0_ISSUER).toBe("https://tenant.uk.auth0.com");
    expect(env.AUTH_URL).toBeUndefined();
  });

  it("parses a valid production config with AUTH_URL", () => {
    const env = parseServerEnv(validProduction);
    expect(env.AUTH_URL).toBe("https://ain.example.com");
  });

  it("requires AUTH_URL in production", () => {
    expect(() =>
      parseServerEnv({ ...validProduction, AUTH_URL: undefined }),
    ).toThrow();
  });

  it("requires the API audience everywhere", () => {
    // Not production-only: without it Auth.js requests no audience, Auth0
    // issues a token the backend cannot read, and every authenticated call
    // fails in a way that looks like broken permissions.
    expect(() =>
      parseServerEnv({
        ...valid,
        NODE_ENV: "development",
        AUTH_AUTH0_AUDIENCE: undefined,
      }),
    ).toThrow();
  });

  it("requires the API origin in production but not locally", () => {
    expect(() =>
      parseServerEnv({ ...validProduction, AIN_API_BASE_URL: undefined }),
    ).toThrow();

    // Locally it falls back to the uvicorn default in the DAL.
    const local = parseServerEnv({ ...valid, NODE_ENV: "development" });
    expect(local.AIN_API_BASE_URL).toBeUndefined();
  });

  it("treats an empty API origin as unset (fails in production)", () => {
    expect(() =>
      parseServerEnv({ ...validProduction, AIN_API_BASE_URL: "" }),
    ).toThrow();
  });

  it("treats an empty AUTH_URL as unset (fails in production)", () => {
    expect(() =>
      parseServerEnv({ ...valid, NODE_ENV: "production", AUTH_URL: "" }),
    ).toThrow();
  });

  it("rejects a weak AUTH_SECRET", () => {
    expect(() => parseServerEnv({ ...valid, AUTH_SECRET: "short" })).toThrow();
  });

  it("rejects a non-https issuer", () => {
    expect(() =>
      parseServerEnv({
        ...valid,
        AUTH_AUTH0_ISSUER: "http://tenant.auth0.com",
      }),
    ).toThrow();
  });

  it("rejects a non-https AUTH_URL", () => {
    expect(() =>
      parseServerEnv({
        ...valid,
        NODE_ENV: "production",
        AUTH_URL: "http://ain.example.com",
      }),
    ).toThrow();
  });

  it("rejects missing Auth0 credentials", () => {
    expect(() =>
      parseServerEnv({
        AUTH_SECRET: valid.AUTH_SECRET,
        AUTH_AUTH0_SECRET: valid.AUTH_AUTH0_SECRET,
        AUTH_AUTH0_ISSUER: valid.AUTH_AUTH0_ISSUER,
      }),
    ).toThrow();
  });
});

describe("getServerEnv", () => {
  it("parses process.env and caches the result", () => {
    vi.stubEnv("AUTH_SECRET", valid.AUTH_SECRET);
    vi.stubEnv("AUTH_AUTH0_ID", valid.AUTH_AUTH0_ID);
    vi.stubEnv("AUTH_AUTH0_SECRET", valid.AUTH_AUTH0_SECRET);
    vi.stubEnv("AUTH_AUTH0_ISSUER", valid.AUTH_AUTH0_ISSUER);
    vi.stubEnv("AUTH_AUTH0_AUDIENCE", valid.AUTH_AUTH0_AUDIENCE);

    const env = getServerEnv();
    expect(env.AUTH_AUTH0_ID).toBe(valid.AUTH_AUTH0_ID);
    // Cached: a second call returns the same instance.
    expect(getServerEnv()).toBe(env);
  });
});
