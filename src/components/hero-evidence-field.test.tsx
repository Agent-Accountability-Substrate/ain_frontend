import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroEvidenceField } from "@/components/hero-evidence-field";

function installMatchMedia({
  desktop = true,
  finePointer = true,
  reducedMotion = false,
} = {}) {
  const matchMedia = vi.fn((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches:
      (query === "(pointer: fine)" && finePointer) ||
      (query === "(min-width: 640px)" && desktop) ||
      (query === "(prefers-reduced-motion: reduce)" && reducedMotion),
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  }));

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: matchMedia,
  });

  return matchMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HeroEvidenceField", () => {
  it("renders a decorative compressed ledger and three staggered trails", () => {
    installMatchMedia();
    const { container, getByTestId } = render(<HeroEvidenceField />);
    const field = getByTestId("hero-evidence-field");
    const rows = Array.from(
      container.querySelectorAll<SVGLineElement>("[data-ledger-row]"),
    );
    const rowPositions = rows.map((row) =>
      Number(row.getAttribute("data-ledger-y")),
    );
    const gaps = rowPositions.slice(1).map((position, index) => {
      return position - rowPositions[index]!;
    });

    // Described, not hidden. The blue trails are agent actions and the warm
    // terminal is the person they resolve to: that is an argument, and a
    // visual carrying an argument gets a description rather than aria-hidden.
    expect(field.getAttribute("aria-hidden")).toBeNull();
    expect(field.getAttribute("role")).toBe("img");
    expect(field.getAttribute("aria-label")).toContain(
      "named accountable person",
    );
    expect(rows).toHaveLength(12);
    expect(
      gaps.every((gap, index) => index === 0 || gap > gaps[index - 1]!),
    ).toBe(true);
    expect(container.querySelectorAll("[data-trail]")).toHaveLength(3);
    expect(
      container.querySelector('[data-trail="primary"]')?.getAttribute("style"),
    ).toContain("--trail-duration: 7s");
    getByTestId("hero-verification-aperture");
  });

  it("damps fine-pointer movement into ledger CSS variables and cleans up", () => {
    installMatchMedia();
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    const cancelFrame = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);
    const { getByTestId, unmount } = render(<HeroEvidenceField />);
    const field = getByTestId("hero-evidence-field");

    vi.spyOn(field, "getBoundingClientRect").mockReturnValue({
      bottom: 500,
      height: 500,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    });

    fireEvent.pointerMove(window, { clientX: 750, clientY: 100 });
    expect(frames).toHaveLength(1);
    frames.shift()!(16);
    expect(
      Number.parseFloat(field.style.getPropertyValue("--ledger-x")),
    ).toBeGreaterThan(0);
    expect(
      Number.parseFloat(field.style.getPropertyValue("--ledger-y")),
    ).toBeLessThan(0);

    unmount();
    expect(cancelFrame).toHaveBeenCalled();
    frames.length = 0;
    fireEvent.pointerMove(window, { clientX: 250, clientY: 250 });
    expect(frames).toHaveLength(0);
  });

  it.each([
    { desktop: true, finePointer: false, reducedMotion: false },
    { desktop: true, finePointer: true, reducedMotion: true },
    { desktop: false, finePointer: true, reducedMotion: false },
  ])(
    "disables cursor tracking for $finePointer/$reducedMotion/$desktop",
    (media) => {
      installMatchMedia(media);
      const requestFrame = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation(() => 1);
      render(<HeroEvidenceField />);

      fireEvent.pointerMove(window, { clientX: 500, clientY: 250 });
      expect(requestFrame).not.toHaveBeenCalled();
    },
  );
});
