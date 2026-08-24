import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteStage } from "@/domains/marketing/site-stage";

/**
 * The scroll handler defers its work to the next frame so a fast wheel cannot
 * queue more repaints than the compositor will draw. Running the callback
 * straight away lets a test assert the result without waiting on a real frame.
 */
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SiteStage", () => {
  it("renders its children", () => {
    render(<SiteStage>the hero</SiteStage>);
    expect(screen.getByText("the hero")).toBeDefined();
  });

  it("starts fully inset", () => {
    render(<SiteStage>the hero</SiteStage>);

    // 0 is the inset card at the top of the page; the CSS derives both the
    // horizontal inset and the corner radius from this one number.
    expect(
      screen.getByTestId("site-stage").style.getPropertyValue("--expand"),
    ).toBe("0.0000");
  });

  it("opens out as the page scrolls past it", () => {
    render(<SiteStage>the hero</SiteStage>);
    const stage = screen.getByTestId("site-stage");

    Object.defineProperty(stage, "offsetTop", { value: 0, configurable: true });
    Object.defineProperty(stage, "offsetHeight", {
      value: 2000,
      configurable: true,
    });
    window.innerHeight = 1000;

    act(() => {
      window.scrollY = 500;
      window.dispatchEvent(new Event("scroll"));
    });

    // Half way through the 1000px of travel between the stage's top and the
    // point its foot reaches the viewport.
    expect(stage.style.getPropertyValue("--expand")).toBe("0.5000");
  });

  it("does not move at all for a visitor who asked for less motion", () => {
    // Scroll-driven expansion is motion from an interaction, so it is not
    // toned down for them — it does not run. The stage holds at the inset card
    // the CSS starts it on, which is also what a visitor with no JavaScript
    // sees, rather than a third state invented for the occasion.
    vi.stubGlobal("matchMedia", () =>
      Object.assign(new EventTarget(), { matches: true }),
    );

    render(<SiteStage>the hero</SiteStage>);
    const stage = screen.getByTestId("site-stage");

    Object.defineProperty(stage, "offsetTop", { value: 0, configurable: true });
    Object.defineProperty(stage, "offsetHeight", {
      value: 2000,
      configurable: true,
    });
    window.innerHeight = 1000;

    act(() => {
      window.scrollY = 500;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(stage.style.getPropertyValue("--expand")).toBe("");
  });

  it("stops, and starts again, when the setting is changed under it", () => {
    const query = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal("matchMedia", () => query);

    render(<SiteStage>the hero</SiteStage>);
    const stage = screen.getByTestId("site-stage");

    Object.defineProperty(stage, "offsetTop", { value: 0, configurable: true });
    Object.defineProperty(stage, "offsetHeight", {
      value: 2000,
      configurable: true,
    });
    window.innerHeight = 1000;

    act(() => {
      window.scrollY = 500;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(stage.style.getPropertyValue("--expand")).toBe("0.5000");

    // Turned on with the page already open. Reading the setting once on mount
    // would leave whatever the last scroll happened to write.
    act(() => {
      query.matches = true;
      query.dispatchEvent(new Event("change"));
    });
    expect(stage.style.getPropertyValue("--expand")).toBe("");

    act(() => {
      window.scrollY = 800;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(stage.style.getPropertyValue("--expand")).toBe("");

    // And back off again.
    act(() => {
      query.matches = false;
      query.dispatchEvent(new Event("change"));
    });
    expect(stage.style.getPropertyValue("--expand")).toBe("0.8000");
  });

  it("never goes past fully open", () => {
    render(<SiteStage>the hero</SiteStage>);
    const stage = screen.getByTestId("site-stage");

    Object.defineProperty(stage, "offsetTop", { value: 0, configurable: true });
    Object.defineProperty(stage, "offsetHeight", {
      value: 1200,
      configurable: true,
    });
    window.innerHeight = 1000;

    act(() => {
      window.scrollY = 99999;
      window.dispatchEvent(new Event("scroll"));
    });

    // Past the clamp the margin would go negative and the stage would bleed
    // off the page rather than sitting flush against it.
    expect(stage.style.getPropertyValue("--expand")).toBe("1.0000");
  });
});
