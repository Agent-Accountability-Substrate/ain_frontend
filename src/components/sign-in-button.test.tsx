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

  it("lets a caller's utilities replace the base ones", () => {
    render(
      <SignInButton className="bg-transparent px-3 py-2 text-ink shadow-none" />,
    );
    const classes = (
      screen.getByRole("button", { name: "Sign in" }).className ?? ""
    ).split(/\s+/);

    // Both would otherwise ship and the stylesheet's order would decide,
    // which is what drove the call sites to reach for !important.
    expect(classes).toContain("px-3");
    expect(classes).not.toContain("px-5");
    expect(classes).toContain("py-2");
    expect(classes).not.toContain("py-3");
    expect(classes).toContain("bg-transparent");
    expect(classes).not.toContain("bg-primary");
    expect(classes).toContain("text-ink");
    expect(classes).not.toContain("text-white");
  });

  it("keeps the base utilities a caller says nothing about", () => {
    render(<SignInButton className="px-3" />);
    const classes = (
      screen.getByRole("button", { name: "Sign in" }).className ?? ""
    ).split(/\s+/);

    expect(classes).toContain("bg-primary");
    expect(classes).toContain("py-3");
  });
});
