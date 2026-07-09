export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fail closed at boot on missing/weak auth config (unset AUTH_URL in
    // production, short AUTH_SECRET, absent Auth0 credentials) rather than at
    // first login. Runs in the Node runtime only — the Edge proxy needs no
    // secrets and reads its config differently.
    const { getServerEnv } = await import("@/lib/server-env");
    getServerEnv();
  }
  const { initSentry } = await import("@/lib/sentry");
  await initSentry("server");
}
