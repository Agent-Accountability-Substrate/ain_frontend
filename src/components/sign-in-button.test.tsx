import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignInButton } from "@/components/sign-in-button";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("SignInButton", () => {
  it("renders a submit button labelled Sign in", () => {
    render(<SignInButton />);

    const button = screen.getByRole("button", { name: "Sign in" });
    expect(button).toBeDefined();
    expect(button.getAttribute("type")).toBe("submit");
  });
});
