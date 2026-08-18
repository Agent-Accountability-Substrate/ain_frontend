/**
 * Stub for the `server-only` marker under Vitest.
 *
 * Next resolves `server-only` internally and, per its own documentation, never
 * uses the npm package's contents — the protection is a build-time error when a
 * client component imports a server module. Vitest has no such handling, so
 * importing it in a test fails to resolve.
 *
 * Aliasing it here keeps the guarantee where it actually lives (`next build`)
 * without adding a runtime dependency whose body is discarded anyway.
 */
export {};
