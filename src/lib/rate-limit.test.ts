import { afterEach, describe, expect, it } from "vitest";

import { overLimit, resetRateLimits } from "@/lib/rate-limit";

const WINDOW = 1000;

afterEach(() => {
  resetRateLimits();
});

describe("overLimit", () => {
  it("allows hits up to the limit and reports the ones past it", () => {
    const at = 0;

    expect(overLimit("k", 2, WINDOW, at)).toBe(false);
    expect(overLimit("k", 2, WINDOW, at)).toBe(false);
    // The third hit is the first one over a limit of two.
    expect(overLimit("k", 2, WINDOW, at)).toBe(true);
  });

  it("keeps a separate budget per key", () => {
    expect(overLimit("a", 1, WINDOW, 0)).toBe(false);
    expect(overLimit("a", 1, WINDOW, 0)).toBe(true);

    // One caller exhausting its budget must not spend anyone else's.
    expect(overLimit("b", 1, WINDOW, 0)).toBe(false);
  });

  it("opens a fresh window once the old one has passed", () => {
    expect(overLimit("k", 1, WINDOW, 0)).toBe(false);
    expect(overLimit("k", 1, WINDOW, 0)).toBe(true);

    // Fixed, not sliding: the window opened at 0, so it is spent at WINDOW.
    expect(overLimit("k", 1, WINDOW, WINDOW)).toBe(false);
  });

  it("stays over the limit for the rest of the window", () => {
    overLimit("k", 1, WINDOW, 0);

    expect(overLimit("k", 1, WINDOW, WINDOW - 1)).toBe(true);
  });

  it("sweeps expired windows without disturbing a live one", () => {
    expect(overLimit("live", 1, WINDOW, 0)).toBe(false);

    // Keys come from a header the caller controls, so rotating it must not
    // grow the map without bound. These windows are spent after 1ms.
    for (let index = 0; index < 10_000; index += 1) {
      overLimit(`rotated:${index}`, 1, 1, 0);
    }

    // This call is past the sweep threshold, so it clears the expired keys —
    // and "live" is still inside its own window, so it keeps its count.
    expect(overLimit("live", 1, WINDOW, 5)).toBe(true);
  });
});
