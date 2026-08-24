import { describe, expect, it, vi } from "vitest";

const { signIn, redirect } = vi.hoisted(() => ({
  signIn: vi.fn(),
  // Matches Next: `redirect` aborts by throwing rather than returning, so a
  // caller cannot accidentally carry on past it.
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/auth", () => ({ signIn }));
vi.mock("next/navigation", () => ({ redirect }));

import { startAuth } from "@/domains/auth/auth-redirects";

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
