import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardView } from "@/components/dashboard-view";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("DashboardView", () => {
  it("shows the signed-in email", () => {
    render(<DashboardView email="user@example.com" />);

    expect(screen.getByText("user@example.com")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeDefined();
  });

  it("falls back to 'unknown' when no email is present", () => {
    render(<DashboardView email={undefined} />);

    expect(screen.getByText("unknown")).toBeDefined();
  });

  it("offers a sign-out button", () => {
    render(<DashboardView email="user@example.com" />);

    expect(screen.getByRole("button", { name: "Sign out" })).toBeDefined();
  });
});
