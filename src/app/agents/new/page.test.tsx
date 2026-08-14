import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/auth-actions", () => ({ signOutAction: vi.fn() }));

import AgentCreationPage from "@/app/agents/new/page";

describe("agent creation page", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders the protected agent route blocked until an organisation exists", async () => {
    authMock.mockResolvedValue({ user: { email: "owner@example.com" } });
    render(await AgentCreationPage());
    expect(
      screen.getByRole("heading", {
        name: "Choose an organisation to continue",
      }),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: /prepare agent record/i }),
    ).toBeNull();
  });

  it("redirects anonymous requests", async () => {
    authMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    await expect(AgentCreationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
