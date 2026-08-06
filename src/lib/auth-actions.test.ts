import { describe, expect, it, vi } from "vitest";

const { signInMock, signOutMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signIn: signInMock,
  signOut: signOutMock,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { signInAction } from "@/lib/auth-actions";

describe("auth actions", () => {
  it("sends successful sign-in to identity onboarding", async () => {
    await signInAction();

    expect(signInMock).toHaveBeenCalledWith("auth0", {
      redirectTo: "/onboarding/identity",
    });
  });
});
