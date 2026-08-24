import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouterStubs } from "@test/stubs/app-router";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  ...appRouterStubs,
  redirect: redirectMock,
}));

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

import IdentityOnboardingPage from "@/app/onboarding/identity/page";

describe("identity onboarding page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders the protected onboarding view for a signed-in user", async () => {
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });

    render(await IdentityOnboardingPage());

    expect(
      screen.getByRole("heading", {
        name: "Verify the person behind the organisation",
      }),
    ).toBeDefined();
    expect(screen.getByText("Casey Morgan")).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed and redirects an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(IdentityOnboardingPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
