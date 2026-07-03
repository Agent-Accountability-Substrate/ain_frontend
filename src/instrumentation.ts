export async function register(): Promise<void> {
  const { initSentry } = await import("@/lib/sentry");
  await initSentry("server");
}
