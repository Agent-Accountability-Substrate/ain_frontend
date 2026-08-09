import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/auth-actions", () => ({ signOutAction: vi.fn() }));

import OrganisationCreationPage from "@/app/organisations/new/page";

describe("organisation creation page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders the protected wizard", async () => {
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });
    render(await OrganisationCreationPage());
    expect(
      screen.getByRole("heading", { name: "Create your first organisation" }),
    ).toBeDefined();
  });

  it("redirects anonymous requests", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    await expect(OrganisationCreationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
