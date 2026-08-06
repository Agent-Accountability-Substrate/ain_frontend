import { render, screen } from "@testing-library/react";
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

import OrganisationsPage from "@/app/organisations/page";

describe("organisations page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders the first-organisation entry point for a signed-in user", async () => {
    authMock.mockResolvedValue({
      user: { email: "creator@example.com", name: "Casey Morgan" },
    });

    render(await OrganisationsPage());

    expect(
      screen.getByRole("heading", { name: "No organisations yet" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Create first organisation" }),
    ).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("fails closed and redirects an anonymous request", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(OrganisationsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
