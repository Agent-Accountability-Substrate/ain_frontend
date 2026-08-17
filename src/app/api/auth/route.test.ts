import { beforeEach, describe, expect, it, vi } from "vitest";

const { handlersGet, handlersPost } = vi.hoisted(() => ({
  handlersGet: vi.fn(),
  handlersPost: vi.fn(),
}));

vi.mock("@/auth", () => ({
  handlers: { GET: handlersGet, POST: handlersPost },
}));

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

/** The route's parameter type is Auth.js's, which a plain Request satisfies. */
function request(path: string): Parameters<typeof GET>[0] {
  return new Request(`http://localhost:3000${path}`) as unknown as Parameters<
    typeof GET
  >[0];
}

describe("auth route handlers", () => {
  beforeEach(() => {
    handlersGet.mockReset();
    handlersPost.mockReset();
    handlersGet.mockResolvedValue(new Response("ok", { status: 200 }));
    handlersPost.mockResolvedValue(new Response("ok", { status: 200 }));
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

  it("refuses the session endpoint on POST too", async () => {
    // POST is the same endpoint, not a different one: it backs Auth.js's
    // session update() flow and answers with the identical serialised session.
    // Blocking only GET blocked nothing, and CSRF is no obstacle to a script
    // that can read /api/auth/csrf from the same origin. Confirmed by
    // observation: with GET already returning 404, a form-encoded POST
    // carrying a fetched csrfToken answered 200 with the access token in full.
    const response = await POST(request("/api/auth/session"));

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(handlersPost).not.toHaveBeenCalled();
  });

  it("passes sign-out and the callback through on POST", async () => {
    // The block is one route on both verbs, not a general gate on POST.
    await POST(request("/api/auth/signout"));
    await POST(request("/api/auth/callback/auth0"));

    expect(handlersPost).toHaveBeenCalledTimes(2);
  });
});
