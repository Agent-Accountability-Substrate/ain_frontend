import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LandingNav } from "@/components/landing-nav";

vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

afterEach(() => {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value: 0,
  });
});

describe("LandingNav", () => {
  it("opens and closes the mobile navigation", () => {
    render(<LandingNav />);
    const toggle = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });

    expect(
      screen.getByRole("link", { name: "SUBRA AIN Registry home" }),
    ).toBeDefined();
    expect(screen.getByRole("img", { name: "SUBRA" })).toBeDefined();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Sign in" })).toHaveLength(2);

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(1);
  });

  it("applies and removes the compact scrolled state", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 30,
    });
    const { container } = render(<LandingNav />);
    const header = container.querySelector("header");

    expect(header?.className).toContain("top-0");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
    fireEvent.scroll(window);

    expect(header?.className).toContain("top-4");
  });
});
