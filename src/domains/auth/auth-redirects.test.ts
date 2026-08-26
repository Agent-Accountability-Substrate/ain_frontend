import { beforeEach, describe, expect, it, vi } from "vitest";

const { signIn, redirect, headers } = vi.hoisted(() => ({
  signIn: vi.fn(),
  // Matches Next: `redirect` aborts by throwing rather than returning, so a
  // caller cannot accidentally carry on past it.
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  headers: vi.fn(),
}));

vi.mock("@/auth", () => ({ signIn }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({ headers }));

import { startAuth } from "@/domains/auth/auth-redirects";

beforeEach(() => {
  vi.clearAllMocks();
  // A person clicking Sign in: no header claiming otherwise.
  headers.mockResolvedValue(new Headers());
});

describe("startAuth", () => {
  it("sends a login to Auth0 with no screen hint", async () => {
    signIn.mockResolvedValue("https://tenant.auth0.com/authorize?state=abc");

    await expect(startAuth("login")).rejects.toThrow(/NEXT_REDIRECT/);

    expect(signIn).toHaveBeenCalledWith(
      "auth0",
      { redirect: false, redirectTo: "/onboarding/identity" },
      undefined,
    );
  });

  it("opens Universal Login on its sign-up screen for a registration", async () => {
    signIn.mockResolvedValue("https://tenant.auth0.com/authorize?state=abc");

    await expect(startAuth("signup")).rejects.toThrow(/NEXT_REDIRECT/);

    expect(signIn).toHaveBeenCalledWith(
      "auth0",
      { redirect: false, redirectTo: "/onboarding/identity" },
      { screen_hint: "signup" },
    );
  });

  it("redirects to whatever Auth.js built, rather than a hand-made URL", async () => {
    // The authorize URL carries the audience, the state and the PKCE
    // challenge. Assembling it here would drop all three and fail at the
    // callback in a way that reads like a broken login.
    signIn.mockResolvedValue(
      "https://tenant.auth0.com/authorize?code_challenge=xyz",
    );

    await expect(startAuth("login")).rejects.toThrow(
      "NEXT_REDIRECT:https://tenant.auth0.com/authorize?code_challenge=xyz",
    );
  });
});

describe("startAuth · a fetch the browser made on its own", () => {
  // Every header a browser uses to say it is guessing at a navigation rather
  // than making one. Chrome's speculation rules and its "preload pages"
  // setting send the first two; the rest are the same signal from browsers
  // that predate the standard one. The App Router's own prefetch is not here:
  // an RSC request never reaches this function, because Next answers it with a
  // redirect before the handler runs.
  const SPECULATIVE: Record<string, string>[] = [
    { "sec-purpose": "prefetch;prerender" },
    { "sec-purpose": "prefetch" },
    { purpose: "prefetch" },
    { "x-moz": "prefetch" },
  ];

  for (const header of SPECULATIVE) {
    const [name] = Object.keys(header);

    it(`starts nothing for ${name}, and says nothing worth keeping`, async () => {
      headers.mockResolvedValue(new Headers(header));

      const response = await startAuth("login");

      // There is one PKCE cookie per browser, not one per tab, so a flow
      // started here would replace the verifier a login already waiting on the
      // Auth0 form is holding — and that visitor never saw this request.
      expect(signIn).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      expect(response.status).toBe(204);
      // Storable, this answer would be replayed for the click it was
      // speculating about, and Sign in would quietly do nothing.
      expect(response.headers.get("cache-control")).toBe("no-store");
    });
  }

  it("still starts one for a header that only looks like a prefetch", async () => {
    headers.mockResolvedValue(new Headers({ purpose: "no-prefetching-here" }));
    signIn.mockResolvedValue("https://tenant.auth0.com/authorize?state=abc");

    // Guessing wrong in this direction costs a visitor their sign-in, so the
    // guard only turns away a request that positively identifies itself.
    await expect(startAuth("login")).rejects.toThrow(/NEXT_REDIRECT/);
    expect(signIn).toHaveBeenCalledOnce();
  });
});
