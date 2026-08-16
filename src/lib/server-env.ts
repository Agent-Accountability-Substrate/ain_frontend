import { z } from "zod";

/**
 * Server-only environment validation for the auth boundary. Kept separate from
 * `@/lib/env` because that module is on the client bundle chain
 * (instrumentation-client → sentry → env); these are server secrets and the
 * external origin, and must never reach the browser. Imported only server-side
 * (instrumentation `register()`), never by a client component.
 *
 * `AUTH_URL` is required in production: it pins the external https origin so
 * Auth.js writes Secure/`__Secure-` session cookies even though TLS terminates
 * at the reverse proxy and the container sees http.
 */
const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    AUTH_SECRET: z.string().min(32),
    AUTH_AUTH0_ID: z.string().min(1),
    AUTH_AUTH0_SECRET: z.string().min(1),
    AUTH_AUTH0_ISSUER: z.string().url().startsWith("https://"),
    // The registered Auth0 API's identifier. Required, not optional: without it
    // Auth.js requests no audience, Auth0 issues a token the backend cannot
    // read, and every authenticated call fails at the edge — a failure that
    // looks like broken permissions rather than missing configuration.
    AUTH_AUTH0_AUDIENCE: z.string().min(1),
    AUTH_URL: z.string().url().startsWith("https://").optional(),
    // Where `ain_backend_api` lives. Optional locally, where it defaults to the
    // uvicorn address in that repo's README; required in production for the
    // same reason as AUTH_URL — a wrong or absent origin must fail at boot, not
    // silently send bearer tokens somewhere unintended.
    AIN_API_BASE_URL: z.string().url().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && env.AUTH_URL === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AUTH_URL"],
        message:
          "AUTH_URL is required in production — pin the external https origin " +
          "so session cookies are written Secure behind the TLS-terminating proxy.",
      });
    }
    if (env.NODE_ENV === "production" && env.AIN_API_BASE_URL === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AIN_API_BASE_URL"],
        message:
          "AIN_API_BASE_URL is required in production — the localhost default " +
          "is a development convenience, and falling back to it in a deployed " +
          "environment would send bearer tokens to nothing.",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function emptyToUndefined(value: string | undefined): string | undefined {
  return value === "" ? undefined : value;
}

/** Parses a server-env source; throws (parse, not safeParse) on invalid input. */
export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  return serverEnvSchema.parse({
    NODE_ENV: emptyToUndefined(source["NODE_ENV"]),
    AUTH_SECRET: emptyToUndefined(source["AUTH_SECRET"]),
    AUTH_AUTH0_ID: emptyToUndefined(source["AUTH_AUTH0_ID"]),
    AUTH_AUTH0_SECRET: emptyToUndefined(source["AUTH_AUTH0_SECRET"]),
    AUTH_AUTH0_ISSUER: emptyToUndefined(source["AUTH_AUTH0_ISSUER"]),
    AUTH_AUTH0_AUDIENCE: emptyToUndefined(source["AUTH_AUTH0_AUDIENCE"]),
    AUTH_URL: emptyToUndefined(source["AUTH_URL"]),
    AIN_API_BASE_URL: emptyToUndefined(source["AIN_API_BASE_URL"]),
  });
}

let cachedServerEnv: ServerEnv | undefined;

/** Parses `process.env` once and caches. Call at boot to fail closed early. */
export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
