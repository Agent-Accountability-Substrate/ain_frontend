import { beforeEach, describe, expect, it, vi } from "vitest";

const { handlersGet, handlersPost } = vi.hoisted(() => ({
  handlersGet: vi.fn(),
  handlersPost: vi.fn(),
}));

vi.mock("@/auth", () => ({
  handlers: { GET: handlersGet, POST: handlersPost },
}));

import { GET } from "@/app/api/auth/[...nextauth]/route";

/** The route's parameter type is Auth.js's, which a plain Request satisfies. */
function request(path: string): Parameters<typeof GET>[0] {
  return new Request(`http://localhost:3000${path}`) as unknown as Parameters<
    typeof GET
  >[0];
}

describe("auth route handlers", () => {
  beforeEach(() => {
    handlersGet.mockReset();
    handlersGet.mockResolvedValue(new Response("ok", { status: 200 }));
  });

  it("refuses the session endpoint without consulting Auth.js", async () => {
    // The session carries the registry API bearer token, and this endpoint
    // hands it to any script on the page. Confirmed by observation before it
    // was blocked, not inferred.
    const response = await GET(request("/api/auth/session"));

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(handlersGet).not.toHaveBeenCalled();
  });

  it("passes every other auth route through untouched", async () => {
    // Sign-in, callback and sign-out must keep working — the block is one
    // route, not a general gate.
    const response = await GET(request("/api/auth/callback/auth0?code=abc"));

    expect(response.status).toBe(200);
    expect(handlersGet).toHaveBeenCalledOnce();
  });

  it("matches on the path, not on a substring of the query", async () => {
    // A callback whose query mentions the word must not be refused.
    await GET(request("/api/auth/callback/auth0?state=/api/auth/session"));

    expect(handlersGet).toHaveBeenCalledOnce();
  });
});
