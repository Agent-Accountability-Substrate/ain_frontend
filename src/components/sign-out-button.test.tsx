import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignOutButton } from "@/components/sign-out-button";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("SignOutButton", () => {
  it("renders a submit button labelled Sign out", () => {
    render(<SignOutButton />);

    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button).toBeDefined();
    expect(button.getAttribute("type")).toBe("submit");
  });
});
