import { vi } from "vitest";

/**
 * The App Router hooks a component may read, as inert stubs.
 *
 * `vitest.setup.ts` stubs these globally, but a `vi.mock("next/navigation")`
 * in a test file *replaces* that module rather than merging with it — so any
 * test mocking `redirect` also silences the hooks, and anything rendering the
 * organisation switcher then dies on "invariant expected app router to be
 * mounted". Spreading this into those factories keeps `redirect` mockable
 * without losing the rest.
 */
export const appRouterStubs = {
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
};
