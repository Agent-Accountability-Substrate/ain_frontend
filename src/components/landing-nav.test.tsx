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

    screen.getByRole("link", { name: "Subra AIN Registry home" });
    screen.getByRole("img", { name: "Subra" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getAllByRole("link", { name: "How it works" })).toHaveLength(
      1,
    );

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("link", { name: "How it works" })).toHaveLength(
      2,
    );
    expect(screen.getAllByRole("button", { name: "Sign in" })).toHaveLength(2);

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getAllByRole("link", { name: "How it works" })).toHaveLength(
      1,
    );
  });

  it("routes the primary CTA to the design partner section", () => {
    render(<LandingNav />);

    const cta = screen.getByRole("link", { name: "Request access" });

    expect(cta.getAttribute("href")).toBe("#talk");
    expect(screen.queryByRole("link", { name: "Download" })).toBeNull();
  });

  it("applies and removes the compact scrolled state", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 30,
    });
    const { container } = render(<LandingNav />);
    const header = container.querySelector("header");

    // The compact state is top-2, never top-0: the pill keeps an 8px gap from
    // the viewport edge even when compact, matching the 16px it already insets
    // horizontally.
    expect(header?.className).toContain("top-2");
    expect(header?.className).not.toContain("top-0");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });
    fireEvent.scroll(window);

    expect(header?.className).toContain("top-4");
  });
});
