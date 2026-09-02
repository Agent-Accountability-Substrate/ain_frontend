import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LandingPartnerCarousel } from "@/domains/marketing/landing-partner-carousel";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("LandingPartnerCarousel", () => {
  it("presents four open collaboration lanes without making partner claims", () => {
    const { container } = render(<LandingPartnerCarousel />);
    const list = screen.getByRole("list", { name: "Open partnership lanes" });

    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(within(list).getByText("AI Platforms")).toBeDefined();
    expect(within(list).getByText("Regulated Firms")).toBeDefined();
    expect(within(list).getByText("Assurance Partners")).toBeDefined();
    expect(within(list).getByText("Get Featured")).toBeDefined();
    expect(screen.getByText("Call for partnerships")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Partner with Subra" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Work with us" }).getAttribute("href"),
    ).toBe("mailto:partner@subrahq.com");

    const duplicate = container.querySelector('ul[aria-hidden="true"]');
    expect(duplicate?.querySelectorAll("li")).toHaveLength(4);
    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText("Open partnerships")).toBeNull();
    expect(container.textContent).not.toMatch(/customer|sponsor|endors/i);
  });

  it("pauses by pointer interaction without adding a control", () => {
    render(<LandingPartnerCarousel />);
    const carousel = screen.getByTestId("partner-carousel");

    expect(carousel.getAttribute("data-motion")).toBe("running");
    fireEvent.mouseEnter(carousel);
    expect(carousel.getAttribute("data-motion")).toBe("paused");
    fireEvent.mouseLeave(carousel);
    expect(carousel.getAttribute("data-motion")).toBe("running");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("pauses while keyboard focus is within the invitation", () => {
    render(<LandingPartnerCarousel />);
    const carousel = screen.getByTestId("partner-carousel");
    const link = screen.getByRole("link", { name: "Work with us" });

    fireEvent.focus(link);
    expect(carousel.getAttribute("data-motion")).toBe("paused");
    fireEvent.blur(link, { relatedTarget: document.body });
    expect(carousel.getAttribute("data-motion")).toBe("running");
  });

  it("uses a static reduced-motion state and cleans up its listener", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { unmount } = render(<LandingPartnerCarousel />);
    const carousel = screen.getByTestId("partner-carousel");

    expect(carousel.getAttribute("data-motion")).toBe("reduced");
    expect(screen.queryByRole("button")).toBeNull();
    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      addEventListener.mock.calls[0]?.[1],
    );
  });
});
