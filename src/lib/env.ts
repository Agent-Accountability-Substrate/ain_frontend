import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Empty strings (e.g. `SENTRY_DSN=` in an env file) are treated as unset
 * so they do not fail URL validation.
 */
function emptyToUndefined(value: string | undefined): string | undefined {
  return value === "" ? undefined : value;
}

/**
 * Parses an env-shaped source against the schema. Pure and testable;
 * throws on invalid input (parse, not safeParse, by convention).
 */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse({
    NODE_ENV: emptyToUndefined(source["NODE_ENV"]),
    SENTRY_DSN: emptyToUndefined(source["SENTRY_DSN"]),
    NEXT_PUBLIC_SENTRY_DSN: emptyToUndefined(source["NEXT_PUBLIC_SENTRY_DSN"]),
  });
}

let cachedEnv: Env | undefined;

/** Parses `process.env` once and caches the result. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env);
  return cachedEnv;
}
