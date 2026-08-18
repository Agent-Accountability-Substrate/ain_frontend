import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * The App Router hooks, stubbed once for every component test.
 *
 * `useRouter` and friends read a context Next mounts around a real request;
 * under jsdom there is none, and any component that reads the current URL —
 * the organisation switcher, for one — fails with "invariant expected app
 * router to be mounted". Stubbing here rather than in each test keeps the
 * mock out of files that are testing something else entirely.
 *
 * `redirect` deliberately throws, matching Next: it aborts rendering rather
 * than returning, and a test that expects a redirect should see that.
 */
vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
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
});

afterEach(() => {
  cleanup();
});
