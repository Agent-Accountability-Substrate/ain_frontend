import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Only the ticker is stubbed, so the component's own render function runs for
// real — the ticker is plumbing, and its wall clock is the one thing a test
// cannot wait on.
const { frames } = vi.hoisted(() => ({
  frames: [] as ((time: number, delta: number) => void)[],
}));

vi.mock("gsap", () => ({
  default: {
    ticker: {
      add: (fn: (time: number, delta: number) => void) => frames.push(fn),
      remove: () => {},
    },
  },
}));

import { LandingIntegrity } from "@/components/landing-integrity";

/**
 * The chain's motion, driven by the real ticker rather than a mock, so this
 * fails if the render stops being called or its selectors stop matching the
 * markup — the two ways this quietly turns into a static table.
 */

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let fire: ObserverCallback | undefined;

function stubObserver() {
  class FakeObserver {
    constructor(callback: ObserverCallback) {
      fire = callback;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
}

/** Advances the figure's clock by `seconds`, in frame-sized steps. */
function advance(seconds: number) {
  const steps = Math.round(seconds / 0.05);
  for (let i = 0; i < steps; i += 1) {
    for (const frame of frames) frame(0, 50);
  }
}

afterEach(() => {
  fire = undefined;
  frames.length = 0;
  vi.unstubAllGlobals();
});

describe("LandingIntegrity motion", () => {
  it("leaves the figure untouched until the reader arrives", () => {
    stubObserver();
    const { container } = render(<LandingIntegrity />);
    const row = container.querySelector("tbody tr") as HTMLElement;

    advance(2);

    // Off screen the render is never called, so the markup's own state — a
    // fully legible table — is what stays.
    expect(row.getAttribute("style")).toBeNull();
  });

  it("never builds the ledger in front of the reader", () => {
    stubObserver();
    const { container } = render(<LandingIntegrity />);
    const rows = [...container.querySelectorAll<HTMLElement>("tbody tr")];

    fire?.([{ isIntersecting: true }]);

    // A table that assembles itself reads as a loading state. Every row is
    // legible from the first frame and stays that way through the whole
    // cycle — the only thing the render touches is the verdict.
    for (const at of [0.3, 1, 4, 9]) {
      advance(at);
      for (const row of rows) {
        expect(row.style.opacity).toBe("");
        expect(row.style.clipPath).toBe("");
      }
    }
  });

  it("breaks every entry chained after the edited one, and only those", () => {
    stubObserver();
    const { container } = render(<LandingIntegrity />);
    const rows = [...container.querySelectorAll("tbody tr")];

    fire?.([{ isIntersecting: true }]);
    // Past the edit at 2s and both cascade steps that follow it.
    advance(5);

    const verdicts = rows.map((row) => {
      const fail = row.querySelector<HTMLElement>('[data-chain-state="fail"]');
      return fail?.style.opacity === "1" ? "failed" : "verified";
    });

    // Genesis sits above the edit, so it survives; everything below it does
    // not, because each one hashes the entry before it.
    expect(verdicts).toEqual(["verified", "failed", "failed", "failed"]);
  });

  it("holds the broken chain far longer than it takes to break it", () => {
    stubObserver();
    const { container } = render(<LandingIntegrity />);
    const rows = [...container.querySelectorAll("tbody tr")];

    fire?.([{ isIntersecting: true }]);
    advance(11);

    // The cycle is 13.3s and the cascade finishes before 4s, so most of it is
    // the broken state sitting still. A loop that restarts on top of the
    // cascade reads as a flicker rather than an argument.
    const stillBroken = rows[3]?.querySelector<HTMLElement>(
      '[data-chain-state="fail"]',
    );
    expect(stillBroken?.style.opacity).toBe("1");
  });
});
