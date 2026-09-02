import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignOutButton } from "@/domains/workspace/sign-out-button";

vi.mock("@/domains/auth/auth-actions", () => ({
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
