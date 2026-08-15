import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

import DashboardPage from "@/app/dashboard/page";

describe("dashboard page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders the protected account overview for a signed-in user", async () => {
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });

    render(await DashboardPage());

    expect(screen.getByRole("heading", { name: "Overview" })).toBeDefined();
    expect(
      within(screen.getByRole("contentinfo")).getByText(
        "No organisation selected",
      ),
    ).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed and redirects an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
