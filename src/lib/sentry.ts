import { parseEnv } from "@/lib/env";

/**
 * Sentry is initialized only when a DSN is configured; without one the
 * SDK is never imported, keeping cold starts and bundles lean.
 */
export function shouldInitSentry(dsn: string | undefined): dsn is string {
  return typeof dsn === "string" && dsn.length > 0;
}

/**
 * Reads the side-appropriate DSN (server: SENTRY_DSN, client:
 * NEXT_PUBLIC_SENTRY_DSN) and initializes Sentry when it is set.
 * Returns whether Sentry was initialized.
 */
export async function initSentry(side: "server" | "client"): Promise<boolean> {
  const env = parseEnv(process.env);
  const dsn = side === "server" ? env.SENTRY_DSN : env.NEXT_PUBLIC_SENTRY_DSN;

  if (!shouldInitSentry(dsn)) {
    return false;
  }

  const sentry = await import("@sentry/nextjs");
  sentry.init({ dsn, sendDefaultPii: false });
  return true;
}
