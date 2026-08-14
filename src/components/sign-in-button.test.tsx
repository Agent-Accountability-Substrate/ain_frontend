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

  it("lets a caller override the base padding instead of merging both", () => {
    render(<SignInButton className="px-4 py-2 text-sm" />);

    const classes =
      screen.getByRole("button", { name: "Sign in" }).className.split(/\s+/);
    expect(classes).toContain("px-4");
    expect(classes).toContain("py-2");
    expect(classes).not.toContain("px-5");
    expect(classes).not.toContain("py-3");
  });
});
