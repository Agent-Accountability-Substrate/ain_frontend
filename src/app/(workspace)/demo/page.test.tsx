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

import AgentDemoPage from "@/app/(workspace)/demo/page";

describe("agent demo page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders the protected illustrative agent workspace", async () => {
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });

    render(await AgentDemoPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Payments Operations Agent",
      }),
    ).toBeDefined();
    expect(screen.getByText("Illustrative workspace data")).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed and redirects an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(AgentDemoPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
