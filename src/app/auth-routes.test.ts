import { describe, expect, it, vi } from "vitest";

import { appFiles } from "@test/app-router-files";

const { startAuth } = vi.hoisted(() => ({ startAuth: vi.fn() }));
vi.mock("@/domains/auth/auth-redirects", () => ({ startAuth }));

import { GET as login } from "@/app/login/route";
import { GET as register } from "@/app/register/route";
import { GET as signin } from "@/app/signin/route";
import { GET as signup } from "@/app/signup/route";

/**
 * The four addresses a person types for a login, and which flow each starts.
 *
 * `auth-redirects.test.ts` covers what `startAuth` does; this covers that the
 * routes exist and are wired to the right intent, so renaming or dropping one
 * fails here.
 */
const ROUTES = [
  { path: "signin", handler: signin, intent: "login" },
  { path: "login", handler: login, intent: "login" },
  { path: "signup", handler: signup, intent: "signup" },
  { path: "register", handler: register, intent: "signup" },
] as const;

describe("the vanity auth routes", () => {
  for (const { path, handler, intent } of ROUTES) {
    it(`/${path} starts the ${intent} flow`, async () => {
      startAuth.mockClear();

      await handler();

      expect(startAuth).toHaveBeenCalledExactlyOnceWith(intent);
    });
  }

  it("has a route file for each, and no others claiming to be one", () => {
    // Read off the directory, to the leaves: a fifth alias added without a
    // test, or one of these deleted, should fail here rather than 404 in
    // production — and one nested a segment deeper is still an alias.
    const onDisk = appFiles()
      .filter((file) => /^route\.(ts|tsx|js|jsx|mjs)$/.test(file.name))
      .map((file) => file.segment)
      // Everything under /api is a handler, not one of the addresses a person
      // types — Auth.js's own route among them.
      .filter((segment) => !segment.startsWith("/api/"));

    expect(onDisk.toSorted()).toEqual(
      ROUTES.map((route) => `/${route.path}`).toSorted(),
    );
  });
});
